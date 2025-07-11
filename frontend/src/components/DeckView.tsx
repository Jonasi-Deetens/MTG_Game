import { useState, useEffect } from 'react';
import type { Deck } from '../types/deck';
import { api } from '../services/api';
import { mtgApi } from '../services/mtgApi';

interface DeckViewProps {
  deckId: number;
  onBack: () => void;
}

const DeckView = ({ deckId, onBack }: DeckViewProps) => {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCommander, setSelectedCommander] = useState<string>('');

  useEffect(() => {
    loadDeck();
  }, [deckId]);

  const loadDeck = async () => {
    try {
      setLoading(true);
      const fetchedDeck = await api.getDeck(deckId);
      setDeck(fetchedDeck);
      setSelectedCommander(fetchedDeck.commander_id || '');
    } catch (err) {
      setError('Failed to load deck');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCommanderChange = async (commanderId: string) => {
    if (!deck) return;

    try {
      const updatedDeck = await api.updateDeck(deck.id, { commander_id: commanderId });
      setDeck(updatedDeck);
      setSelectedCommander(commanderId);
    } catch (err) {
      setError('Failed to update commander');
      console.error(err);
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

  const getCardTypeColor = (type?: string) => {
    if (!type) return 'bg-gray-100';
    
    if (type.includes('Land')) return 'bg-yellow-100 text-yellow-800';
    if (type.includes('Creature')) return 'bg-green-100 text-green-800';
    if (type.includes('Instant')) return 'bg-blue-100 text-blue-800';
    if (type.includes('Sorcery')) return 'bg-red-100 text-red-800';
    if (type.includes('Enchantment')) return 'bg-purple-100 text-purple-800';
    if (type.includes('Artifact')) return 'bg-gray-100 text-gray-800';
    if (type.includes('Planeswalker')) return 'bg-orange-100 text-orange-800';
    
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">{error || 'Deck not found'}</p>
        <button
          onClick={onBack}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Back to Decks
        </button>
      </div>
    );
  }

  const totalCards = deck.cards.reduce((sum, card) => sum + card.quantity, 0);
  const commander = deck.legendary_creatures.find(c => c.id === deck.commander_id);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-800 mr-4"
          >
            ← Back to Decks
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{deck.name}</h1>
            {deck.description && (
              <p className="text-gray-600 mt-1">{deck.description}</p>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-500">
            {deck.cards.length} unique cards
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {totalCards} total cards
          </div>
        </div>
      </div>

      {/* Commander Section */}
      {deck.legendary_creatures.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Commander</h2>
          
          {commander ? (
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="font-semibold text-lg">{commander.name}</div>
                {commander.mana_cost && (
                  <div className="text-gray-600">{getManaSymbols(commander.mana_cost)}</div>
                )}
              </div>
              <button
                onClick={() => handleCommanderChange('')}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove Commander
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">Select a commander from your legendary creatures:</p>
              <select
                value={selectedCommander}
                onChange={(e) => handleCommanderChange(e.target.value)}
                className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a commander...</option>
                {deck.legendary_creatures.map((creature) => (
                  <option key={creature.id} value={creature.id}>
                    {creature.name} {creature.mana_cost && `(${creature.mana_cost})`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Cards Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Deck List</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Card Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mana Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CMC
                </th>
                {deck.cards.some(card => card.power || card.toughness) && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    P/T
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deck.cards.map((card, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {card.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {card.name}
                      {card.error && (
                        <span className="text-red-500 ml-2">(Not found)</span>
                      )}
                    </div>
                    {card.rarity && (
                      <div className="text-xs text-gray-500">{card.rarity}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {card.mana_cost && getManaSymbols(card.mana_cost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCardTypeColor(card.type)}`}>
                      {card.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {card.cmc || '-'}
                  </td>
                  {deck.cards.some(c => c.power || c.toughness) && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {card.power && card.toughness ? `${card.power}/${card.toughness}` : '-'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deck Statistics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Card Types</h3>
          <div className="space-y-2">
            {Object.entries(
              deck.cards.reduce((acc, card) => {
                if (card.type) {
                  const type = card.type.split('—')[0].trim();
                  acc[type] = (acc[type] || 0) + card.quantity;
                }
                return acc;
              }, {} as Record<string, number>)
            ).map(([type, count]) => (
              <div key={type} className="flex justify-between">
                <span className="text-gray-600">{type}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Mana Curve</h3>
          <div className="space-y-2">
            {Object.entries(
              deck.cards.reduce((acc, card) => {
                const cmc = card.cmc || 0;
                acc[cmc] = (acc[cmc] || 0) + card.quantity;
                return acc;
              }, {} as Record<number, number>)
            )
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([cmc, count]) => (
                <div key={cmc} className="flex justify-between">
                  <span className="text-gray-600">CMC {cmc}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Colors</h3>
          <div className="space-y-2">
            {Object.entries(
              deck.cards.reduce((acc, card) => {
                if (card.colors && card.colors.length > 0) {
                  card.colors.forEach(color => {
                    acc[color] = (acc[color] || 0) + card.quantity;
                  });
                } else if (!card.colors || card.colors.length === 0) {
                  acc['Colorless'] = (acc['Colorless'] || 0) + card.quantity;
                }
                return acc;
              }, {} as Record<string, number>)
            ).map(([color, count]) => (
              <div key={color} className="flex justify-between">
                <span className="text-gray-600">{color}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeckView; 