import React from 'react';
import type { Card } from '../../types/deck';
import MtgCard from '../MtgCard';

interface ShuffledCard extends Card {
  originalIndex: number;
}

interface SearchModalProps {
  searchResults: ShuffledCard[];
  onSearch: (searchTerm: string) => void;
  onSelectCard: (card: ShuffledCard, action: 'toHand' | 'toBattlefield' | 'toTop') => void;
  onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ 
  searchResults, 
  onSearch, 
  onSelectCard, 
  onClose 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto shadow-2xl border border-yellow-400">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-white">Search Library</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700 transition-colors"
          >
            ×
          </button>
        </div>
        
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search for cards by name, type, or text..."
            onChange={(e) => onSearch(e.target.value)}
            className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-yellow-400 focus:outline-none"
            autoFocus
          />
        </div>
        
        {searchResults.length > 0 && (
          <div>
            <h3 className="text-white font-semibold mb-3">Results ({searchResults.length}):</h3>
            <div className="grid grid-cols-4 gap-3">
              {searchResults.map((card, index) => (
                <div
                  key={`${card.id}-${index}`}
                  className="bg-gray-700 rounded-lg p-3 border border-gray-600"
                >
                  <MtgCard
                    card={card}
                    showName={false}
                    context="library"
                    actions={{
                      read: () => {}
                    }}
                  />
                  <div className="mt-3 space-y-2">
                    <button
                      onClick={() => onSelectCard(card, 'toHand')}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 px-3 rounded transition-colors"
                    >
                      Add to Hand
                    </button>
                    <button
                      onClick={() => onSelectCard(card, 'toBattlefield')}
                      className="w-full bg-green-600 hover:bg-green-500 text-white text-xs py-2 px-3 rounded transition-colors"
                    >
                      Put on Battlefield
                    </button>
                    <button
                      onClick={() => onSelectCard(card, 'toTop')}
                      className="w-full bg-yellow-600 hover:bg-yellow-500 text-white text-xs py-2 px-3 rounded transition-colors"
                    >
                      Put on Top
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {searchResults.length === 0 && (
          <div className="text-gray-400 text-center py-8">
            No cards found. Try a different search term.
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchModal; 