import React from 'react';
import type { Card } from '../../types/deck';
import MtgCard from '../MtgCard';

interface GraveyardCard extends Card {
  discardedAt: Date;
}

interface GraveyardModalProps {
  graveyard: GraveyardCard[];
  onReturnToHand: (card: GraveyardCard) => void;
  onReturnToBattlefield: (card: GraveyardCard) => void;
  onExile: (card: GraveyardCard) => void;
  onShuffleIntoLibrary: (card: GraveyardCard) => void;
  onReturnToField: (card: GraveyardCard) => void;
  onClose: () => void;
}

const GraveyardModal: React.FC<GraveyardModalProps> = ({
  graveyard,
  onReturnToHand,
  onReturnToBattlefield,
  onExile,
  onShuffleIntoLibrary,
  onReturnToField,
  onClose
}) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
      style={{ backdropFilter: "blur(2px)", zIndex: 999999 }}
    >
      <div
        className="bg-gray-800 rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto shadow-2xl border border-gray-600"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <span className="text-4xl mr-3">💀</span>
            Graveyard ({graveyard.length} cards)
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700 transition-colors"
          >
            ×
          </button>
        </div>

        {graveyard.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">💀</div>
            <p className="text-gray-300 text-lg">Graveyard is empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {graveyard.map((card, index) => (
              <div key={`graveyard-modal-${card.id}-${index}`} className="relative">
                <MtgCard
                  card={card}
                  showName={false}
                  showTimestamp={false}
                  context="graveyard"
                  actions={{
                    returnToHand: () => {
                      console.log('Returning from graveyard to hand:', card.name);
                      onReturnToHand(card);
                    },
                    returnToLibrary: () => {
                      console.log('Shuffling from graveyard to library:', card.name);
                      onShuffleIntoLibrary(card);
                    },
                    exile: () => {
                      console.log('Exiling from graveyard:', card.name);
                      onExile(card);
                    },
                    play: () => {
                      console.log('Returning from graveyard to battlefield:', card.name);
                      onReturnToBattlefield(card);
                    },
                    returnToField: () => {
                      console.log('Returning from graveyard to field:', card.name);
                      onReturnToField(card);
                    }
                  }}
                />
                <div className="mt-2 text-xs text-gray-400 text-center">
                  Discarded: {card.discardedAt.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GraveyardModal; 