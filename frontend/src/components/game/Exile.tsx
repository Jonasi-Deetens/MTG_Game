import React, { useState } from 'react';
import type { Card } from '../../types/deck';
import MtgCard from '../MtgCard';
import ExileModal from './ExileModal';

// ExileCard is now just Card (removed exiledAt property)
type ExileCard = Card;

interface ExileProps {
  exile: ExileCard[];
  onReturnToHand: (card: ExileCard) => void;
  onMoveToGraveyard: (card: ExileCard) => void;
  onShuffleIntoLibrary: (card: ExileCard) => void;
  onReturnToField: (card: ExileCard) => void;
}

const Exile: React.FC<ExileProps> = ({
  exile,
  onReturnToHand,
  onMoveToGraveyard,
  onShuffleIntoLibrary,
  onReturnToField
}) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div 
        className="col-span-4 h-64 row-span-1 row-start-3 flex flex-col items-center justify-center cursor-pointer"
        onClick={() => setShowModal(true)}
      >
        <h3 className="text-white text-lg font-bold mb-2 drop-shadow-lg">
          Exile ({exile.length})
        </h3>
        {exile.length === 0 ? (
          <div className="w-32 h-44 bg-gradient-to-br from-purple-700 to-purple-600 rounded-lg flex items-center justify-center border-2 border-purple-300 shadow-lg">
            <span className="text-purple-200 text-xs font-semibold">
              Empty
            </span>
          </div>
        ) : (
          <div className="w-full h-48 flex justify-center items-center">
            <div className="relative w-32 h-44">
              {exile.slice(-8).map((card, index) => (
                <div 
                  key={`exile-${card.id}-${index}`} 
                  className="absolute transform hover:scale-105 transition-transform"
                  style={{ 
                    left: `${index * 6}px`, 
                    top: `${index * 4}px`,
                    zIndex: index 
                  }}
                >
                  <MtgCard
                    card={card}
                    showName={false}
                    showTimestamp={false}
                    context="exile"
                    showOverlay={false}
                    actions={{}}
                  />
                </div>
              ))}
              {exile.length > 8 && (
                <div className="absolute text-purple-300 text-sm text-center py-2 bg-purple-800/50 rounded-lg border border-purple-400"
                     style={{ 
                       left: `${Math.min(8, exile.length) * 6}px`, 
                       top: `${Math.min(8, exile.length) * 4}px`,
                       zIndex: Math.min(8, exile.length)
                     }}>
                  +{exile.length - 8} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <ExileModal
          exile={exile}
          onReturnToHand={onReturnToHand}
          onMoveToGraveyard={onMoveToGraveyard}
          onShuffleIntoLibrary={onShuffleIntoLibrary}
          onReturnToField={onReturnToField}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default Exile; 