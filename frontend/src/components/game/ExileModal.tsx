import React from 'react';
import type { Card } from '../../types/deck';
import MtgCard from '../MtgCard';

// ExileCard is now just Card (removed exiledAt property)
type ExileCard = Card;

interface ExileModalProps {
  exile: ExileCard[];
  onReturnToHand: (card: ExileCard) => void;
  onMoveToGraveyard: (card: ExileCard) => void;
  onShuffleIntoLibrary: (card: ExileCard) => void;
  onReturnToField: (card: ExileCard) => void;
  onClose: () => void;
}

const ExileModal: React.FC<ExileModalProps> = ({
  exile,
  onReturnToHand,
  onMoveToGraveyard,
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
        className="bg-purple-900 rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto shadow-2xl border border-purple-600"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <span className="text-4xl mr-3">🌀</span>
            Exile ({exile.length} cards)
          </h2>
          <button
            onClick={onClose}
            className="text-purple-400 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-purple-700 transition-colors"
          >
            ×
          </button>
        </div>

        {exile.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🌀</div>
            <p className="text-purple-300 text-lg">Exile is empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {exile.map((card, index) => (
              <div key={`exile-modal-${card.id}-${index}`} className="relative">
                <MtgCard
                  card={card}
                  showName={false}
                  showTimestamp={false}
                  context="exile"
                  actions={{
                    returnToHand: () => {
                      console.log('Returning from exile to hand:', card.name);
                      onReturnToHand(card);
                    },
                    exile: () => {
                      console.log('Moving from exile to graveyard:', card.name);
                      onMoveToGraveyard(card);
                    },
                    returnToLibrary: () => {
                      console.log('Shuffling from exile into library:', card.name);
                      onShuffleIntoLibrary(card);
                    },
                    returnToField: () => {
                      console.log('Returning from exile to field:', card.name);
                      onReturnToField(card);
                    }
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExileModal; 