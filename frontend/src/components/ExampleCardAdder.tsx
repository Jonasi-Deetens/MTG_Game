import React, { useState } from 'react';
import { useDeck } from '../contexts/DeckProvider';
import { getAllExampleCards, getExampleCardsByType } from '../utils/cardEffects';
import type { Card } from '../types/deck';

const ExampleCardAdder: React.FC = () => {
  const { activePlayerId, getPlayer, addExampleCardToHand } = useDeck();
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showCardList, setShowCardList] = useState(false);

  const activePlayer = getPlayer(activePlayerId);
  
  // Debug logging
  console.log('ExampleCardAdder render:', { activePlayerId, activePlayer });
  
  // Always render the component, even if no active player
  const allCards = getAllExampleCards();
  console.log('All example cards:', allCards); // Debug log
  
  const filteredCards = selectedType === 'all' 
    ? allCards 
    : getExampleCardsByType(selectedType);
  
  console.log('Filtered cards for type', selectedType, ':', filteredCards); // Debug log

  const cardTypes = ['all', 'instant', 'sorcery', 'creature'];

  const addCardToHand = (card: Card) => {
    console.log('Adding card to hand:', card); // Debug log
    if (!activePlayer) {
      console.log('No active player, cannot add card');
      alert('No active player found. Please load a deck first.');
      return;
    }
    addExampleCardToHand(activePlayerId, card);
    alert(`Added ${card.name} to your hand! You now have ${activePlayer.drawnCards.length + 1} cards in hand.`);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4 border-2 border-red-500">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-lg font-bold">Add Example Cards</h3>
        <div className="flex items-center space-x-2">
          {!activePlayer && (
            <span className="text-red-400 text-sm">No active player</span>
          )}
          <button
            onClick={() => setShowCardList(!showCardList)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
          >
            {showCardList ? 'Hide' : 'Show'} Cards ({allCards.length})
          </button>
        </div>
      </div>

      {showCardList && (
        <div className="space-y-4">
          {/* Type Filter */}
          <div className="flex space-x-2">
            {cardTypes.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 rounded text-sm capitalize ${
                  selectedType === type
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Card List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {filteredCards.map(card => (
              <div
                key={card.id}
                className="bg-gray-700 rounded p-3 border border-gray-600 hover:border-blue-400 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-white font-semibold text-sm">{card.name}</h4>
                  <span className="text-gray-400 text-xs">{card.mana_cost}</span>
                </div>
                
                <p className="text-gray-300 text-xs mb-2">{card.type}</p>
                
                {card.effects && card.effects.length > 0 && (
                  <div className="mb-2">
                    <p className="text-blue-300 text-xs font-semibold">Effects:</p>
                    {card.effects.map((effect, index) => (
                      <p key={index} className="text-gray-400 text-xs">
                        • {effect.description}
                      </p>
                    ))}
                  </div>
                )}

                {card.keywords && card.keywords.length > 0 && (
                  <div className="mb-2">
                    <p className="text-green-300 text-xs font-semibold">Keywords:</p>
                    <p className="text-gray-400 text-xs">
                      {card.keywords.join(', ')}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => addCardToHand(card)}
                  disabled={!activePlayer}
                  className={`w-full text-xs py-1 rounded transition-colors ${
                    activePlayer 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  {activePlayer ? 'Add to Hand' : 'No Active Player'}
                </button>
              </div>
            ))}
          </div>

          {filteredCards.length === 0 && (
            <p className="text-gray-400 text-center py-4">
              No cards found for the selected type.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ExampleCardAdder; 