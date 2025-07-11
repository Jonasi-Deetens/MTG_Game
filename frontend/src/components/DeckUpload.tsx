import { useState, useRef } from 'react';
import type { DeckFormData, Card } from '../types/deck';
import type { LegendaryCreature } from '../services/mtgApi';
import { api } from '../services/api';
import { mtgApi } from '../services/mtgApi';
import { enhanceCardWithEffects, hasCustomEffects } from '../utils/cardEffects';

interface DeckUploadProps {
  onBack: () => void;
  onDeckCreated: () => void;
}

const DeckUpload = ({ onBack, onDeckCreated }: DeckUploadProps) => {
  const [formData, setFormData] = useState<DeckFormData>({
    name: '',
    description: '',
    commander_id: '',
    deck_list: []
  });
  
  const [fileContent, setFileContent] = useState<string>('');
  const [legendaryCreatures, setLegendaryCreatures] = useState<LegendaryCreature[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [processingCards, setProcessingCards] = useState(false);
  const [cardProcessingProgress, setCardProcessingProgress] = useState(0);
  const [processedCards, setProcessedCards] = useState<Card[]>([]);
  const [failedCards, setFailedCards] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
      parseDeckList(content);
    };
    reader.readAsText(file);
  };

  const parseDeckList = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    const deckList: Array<{ quantity: number; name: string }> = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Parse quantity and card name
      const match = trimmedLine.match(/^(\d+)\s+(.+)$/);
      if (match) {
        const quantity = parseInt(match[1], 10);
        const cardName = match[2].trim();
        
        deckList.push({ quantity, name: cardName });
      } else {
        // If no quantity specified, assume 1
        deckList.push({ quantity: 1, name: trimmedLine });
      }
    }

    setFormData(prev => ({ ...prev, deck_list: deckList }));
    
    // Process cards to fetch full data and find legendary creatures
    if (deckList.length > 0) {
      processCardsForData(deckList);
    }
  };

  const processCardsForData = async (deckList: Array<{ quantity: number; name: string }>) => {
    setProcessingCards(true);
    setCardProcessingProgress(0);
    setProcessedCards([]);
    setFailedCards([]);
    setLegendaryCreatures([]);
    
    const legendaryCreaturesFound: LegendaryCreature[] = [];
    const processedCardsData: Card[] = [];
    const failedCardsList: string[] = [];
    let processed = 0;
    
    const totalCards = deckList.length;

    for (const cardEntry of deckList) {
      try {
        // Try exact match first
        let card = await mtgApi.getCardByName(cardEntry.name);
        
        // If exact match fails, try fuzzy match
        if (!card) {
          card = await mtgApi.getCardByFuzzyName(cardEntry.name);
        }

        if (card) {
          // Create full card data for backend
          const basicCardData: Card = {
            quantity: cardEntry.quantity,
            name: card.name,
            mana_cost: card.mana_cost,
            cmc: card.cmc,
            type: card.type_line,
            text: card.oracle_text,
            power: card.power,
            toughness: card.toughness,
            image_url: card.image_uris?.normal,
            id: parseInt(card.id) || Date.now() + Math.random(), // Ensure it's a number
            rarity: card.rarity,
            set_name: card.set_name
          };
          
          // Enhance the card with custom effects, keywords, and abilities
          const enhancedCardData = enhanceCardWithEffects(basicCardData);
          
          // Log if we found custom effects for this card
          if (hasCustomEffects(card.name)) {
            console.log(`Enhanced ${card.name} with custom effects:`, {
              keywords: enhancedCardData.keywords,
              effects: enhancedCardData.effects,
              activatedAbilities: enhancedCardData.activatedAbilities
            });
          }
          
          processedCardsData.push(enhancedCardData);

          // Check if it's a legendary creature
          if (mtgApi.isLegendaryCreature(card)) {
            const existingIndex = legendaryCreaturesFound.findIndex(lc => lc.id === card.id);
            if (existingIndex === -1) {
              legendaryCreaturesFound.push({
                id: card.id,
                name: card.name,
                mana_cost: card.mana_cost,
                type_line: card.type_line,
                colors: card.colors,
                cmc: card.cmc,
                image_uris: card.image_uris,
              });
            }
          }
        } else {
          // Card not found, add to failed list
          failedCardsList.push(cardEntry.name);
          console.warn(`Card not found: ${cardEntry.name}`);
        }

        processed++;
        setCardProcessingProgress((processed / totalCards) * 100);
        setProcessedCards([...processedCardsData]);
        setFailedCards([...failedCardsList]);
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error processing card ${cardEntry.name}:`, error);
        failedCardsList.push(cardEntry.name);
        processed++;
        setCardProcessingProgress((processed / totalCards) * 100);
        setFailedCards([...failedCardsList]);
        // Continue processing other cards even if one fails
      }
    }

    setLegendaryCreatures(legendaryCreaturesFound);
    setProcessingCards(false);
    
    // Show summary of what was found
    if (legendaryCreaturesFound.length > 0) {
      console.log(`Found ${legendaryCreaturesFound.length} legendary creatures:`, 
        legendaryCreaturesFound.map(lc => lc.name));
    } else {
      console.log('No legendary creatures found in the deck');
    }
    
    if (failedCardsList.length > 0) {
      console.log(`Failed to fetch data for ${failedCardsList.length} cards:`, failedCardsList);
    }
    
    console.log(`Successfully processed ${processedCardsData.length} cards`);
  };

  const handleInputChange = (field: keyof DeckFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Deck name is required');
      return;
    }

    if (processedCards.length === 0) {
      setError('Please upload a deck list and wait for processing to complete');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create optimized deck data with full card information
      const optimizedDeckData = {
        name: formData.name,
        description: formData.description,
        commander_id: formData.commander_id,
        cards: processedCards // Send full card data instead of just names
      };

      console.log('Submitting optimized deck data:', optimizedDeckData);
      const result = await api.createOptimizedDeck(optimizedDeckData);
      console.log('Deck created successfully:', result);
      setSuccess(true);
      setTimeout(() => {
        onDeckCreated();
      }, 1000);
    } catch (err) {
      console.error('Error creating deck:', err);
      setError(`Failed to create deck: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setFileContent('');
    setFormData(prev => ({ ...prev, deck_list: [] }));
    setLegendaryCreatures([]);
    setProcessedCards([]);
    setFailedCards([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getManaSymbols = (manaCost?: string) => {
    if (!manaCost) return null;
    
    return mtgApi.getManaSymbols(manaCost).map((symbol, index) => (
      <span key={index} className="inline-block w-4 h-4 bg-gray-200 rounded text-xs flex items-center justify-center mx-0.5">
        {symbol}
      </span>
    ));
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Deck Created Successfully!</h2>
          <p className="text-gray-600 mb-6">Redirecting to deck list...</p>
          <button
            onClick={onDeckCreated}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue to Deck List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 mr-4"
        >
          ← Back to Decks
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Create New Deck</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Deck Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Deck Information</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Deck Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter deck name"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter deck description (optional)"
              />
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Upload Deck List</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
                Deck File (.txt)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                id="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Upload a .txt file with one card per line in format: "2 Island" or "1 Lightning Bolt"
              </p>
            </div>

            {processingCards && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-800">
                      Fetching card data from Scryfall API...
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Processing {formData.deck_list.length} unique cards to get full card information
                    </p>
                    <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${cardProcessingProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      {Math.round(cardProcessingProgress)}% complete ({Math.round(cardProcessingProgress * formData.deck_list.length / 100)}/{formData.deck_list.length} cards)
                    </p>
                    {processedCards.length > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        ✅ {processedCards.length} cards processed successfully
                      </p>
                    )}
                    {failedCards.length > 0 && (
                      <p className="text-xs text-orange-600 mt-1">
                        ⚠️ {failedCards.length} cards failed to fetch
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {fileContent && !processingCards && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Card Processing Results
                  </label>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Clear
                  </button>
                </div>
                
                {/* Processing Summary */}
                <div className="mb-3 p-3 bg-gray-50 rounded-md">
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Total unique cards:</span>
                      <span className="font-medium">{formData.deck_list.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Successfully processed:</span>
                      <span className="font-medium text-green-600">{processedCards.length}</span>
                    </div>
                    {failedCards.length > 0 && (
                      <div className="flex justify-between">
                        <span>Failed to fetch:</span>
                        <span className="font-medium text-orange-600">{failedCards.length}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Total cards in deck:</span>
                      <span className="font-medium">{processedCards.reduce((sum, card) => sum + (card.quantity || 1), 0)}</span>
                    </div>
                  </div>
                  
                  {failedCards.length > 0 && (
                    <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs">
                      <p className="text-orange-800 font-medium mb-1">Failed cards:</p>
                      <p className="text-orange-700">{failedCards.join(', ')}</p>
                      <p className="text-orange-600 mt-1">These cards will still be saved with basic information.</p>
                    </div>
                  )}
                  
                  {/* Enhanced Cards Notification */}
                  {processedCards.length > 0 && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                      <p className="text-green-800 font-medium mb-1">Cards Enhanced:</p>
                      <p className="text-green-700">
                        {processedCards.filter(card => hasCustomEffects(card.name)).length} cards enhanced with custom MTG effects, keywords, and activated abilities
                      </p>
                      {processedCards.filter(card => hasCustomEffects(card.name)).length > 0 && (
                        <p className="text-green-600 mt-1">
                          Enhanced cards: {processedCards.filter(card => hasCustomEffects(card.name)).map(card => card.name).join(', ')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3 bg-gray-50">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {fileContent}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Commander Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Commander Selection</h2>
          
          {legendaryCreatures.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Found {legendaryCreatures.length} legendary creature(s) in your deck:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {legendaryCreatures.map((creature) => (
                  <div
                    key={creature.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      formData.commander_id === creature.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleInputChange('commander_id', creature.id)}
                  >
                    <div className="flex items-start space-x-3">
                      {creature.image_uris?.small && (
                        <img
                          src={creature.image_uris.small}
                          alt={creature.name}
                          className="w-12 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{creature.name}</h3>
                        {creature.mana_cost && (
                          <div className="text-gray-600 text-sm mt-1">
                            {getManaSymbols(creature.mana_cost)}
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">{creature.type_line}</p>
                        {creature.cmc !== undefined && (
                          <p className="text-xs text-gray-500">CMC: {creature.cmc}</p>
                        )}
                      </div>
                      {formData.commander_id === creature.id && (
                        <div className="text-green-600">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div>
                <label htmlFor="commander" className="block text-sm font-medium text-gray-700 mb-1">
                  Selected Commander
                </label>
                <select
                  id="commander"
                  value={formData.commander_id}
                  onChange={(e) => handleInputChange('commander_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No commander selected</option>
                  {legendaryCreatures.map((creature) => (
                    <option key={creature.id} value={creature.id}>
                      {creature.name} {creature.mana_cost && `(${creature.mana_cost})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">👑</div>
              <p className="text-gray-600">
                {processingCards 
                  ? 'Searching for legendary creatures...' 
                  : 'No legendary creatures found in your deck. All cards will still be saved to your deck.'
                }
              </p>
              {!processingCards && processedCards.length > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Your deck contains {processedCards.length} unique cards ({processedCards.reduce((sum, card) => sum + (card.quantity || 1), 0)} total cards) and will be saved completely.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !formData.name.trim() || processedCards.length === 0 || processingCards}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Deck'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DeckUpload; 