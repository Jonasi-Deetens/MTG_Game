import React, { useState } from 'react';
import type { Card } from '../../types/deck';
import MtgCard from '../MtgCard';

interface ScryModalProps {
  scryCards: Card[];
  onDecision: (orderedCards: number[]) => void;
  onClose: () => void;
}

const ScryModal: React.FC<ScryModalProps> = ({ scryCards, onDecision, onClose }) => {
  const [scryOrder, setScryOrder] = useState<number[]>([]);

  const toggleCardInScryOrder = (cardIndex: number) => {
    setScryOrder(prev => {
      if (prev.includes(cardIndex)) {
        // Remove from order
        return prev.filter(index => index !== cardIndex);
      } else {
        // Add to order (at the end)
        return [...prev, cardIndex];
      }
    });
  };

  const handleConfirm = () => {
    onDecision(scryOrder);
    setScryOrder([]);
  };

  const handlePutAllOnBottom = () => {
    onDecision([]);
    setScryOrder([]);
  };

  const handleClose = () => {
    setScryOrder([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto shadow-2xl border border-purple-400">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-white">Scry {scryCards.length}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700 transition-colors"
          >
            ×
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-white text-sm mb-3">
            Click cards to select the order they should appear on top of your library. Unselected cards will go to the bottom:
          </p>
          
          <div className="grid grid-cols-1 gap-4 mb-4">
            <div>
              <h3 className="text-green-300 font-semibold mb-2">Select Cards for Top of Library (in order):</h3>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {scryCards.map((card, index) => {
                  const isSelected = scryOrder.includes(index);
                  const position = scryOrder.indexOf(index) + 1;
                  return (
                    <div
                      key={index}
                      className={`rounded-lg p-2 border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-green-600 border-green-400 shadow-lg' 
                          : 'bg-gray-700 border-gray-500 hover:bg-gray-600'
                      }`}
                      onClick={() => toggleCardInScryOrder(index)}
                    >
                      <MtgCard
                        card={card}
                        showName={false}
                        context="library"
                        actions={{
                          read: () => {}
                        }}
                      />
                      <div className="text-white text-xs text-center mt-1">
                        {isSelected ? `Top #${position}` : `Card ${index + 1}`}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={handleConfirm}
                  disabled={scryOrder.length === 0}
                  className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm py-2 px-4 rounded transition-colors"
                >
                  Confirm Order ({scryOrder.length} cards on top)
                </button>
                <button
                  onClick={handlePutAllOnBottom}
                  className="bg-red-600 hover:bg-red-500 text-white text-sm py-2 px-4 rounded transition-colors"
                >
                  Put All on Bottom
                </button>
                <button
                  onClick={() => setScryOrder([])}
                  className="bg-gray-600 hover:bg-gray-500 text-white text-sm py-2 px-4 rounded transition-colors"
                >
                  Clear Selection
                </button>
              </div>
              
              {scryOrder.length > 0 && (
                <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                  <h4 className="text-white font-semibold mb-2">Selected Order:</h4>
                  <div className="flex flex-wrap gap-2">
                    {scryOrder.map((cardIndex, orderIndex) => (
                      <div key={cardIndex} className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                        {orderIndex + 1}. {scryCards[cardIndex].name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScryModal; 