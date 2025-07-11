import React, { useState } from 'react';
import type { Card } from '../../types/deck';
import MtgCard from '../MtgCard';
import GraveyardModal from './GraveyardModal';

interface GraveyardCard extends Card {
  discardedAt: Date;
}

interface GraveyardProps {
  graveyard: GraveyardCard[];
  onReturnToHand: (card: GraveyardCard) => void;
  onReturnToBattlefield: (card: GraveyardCard) => void;
  onExile: (card: GraveyardCard) => void;
  onShuffleIntoLibrary: (card: GraveyardCard) => void;
  onReturnToField: (card: GraveyardCard) => void;
}

const Graveyard: React.FC<GraveyardProps> = ({
  graveyard,
  onReturnToHand,
  onReturnToBattlefield,
  onExile,
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
          Graveyard ({graveyard.length})
        </h3>
        {graveyard.length === 0 ? (
          <div className="w-32 h-44 bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg flex items-center justify-center border-2 border-gray-400 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.3)_1px,transparent_1px)] bg-[length:4px_4px]"></div>
            <div className="text-gray-300 text-center relative z-10">
              <div className="text-4xl mb-2 drop-shadow-lg">💀</div>
              <div className="text-xs font-semibold">Empty</div>
            </div>
          </div>
        ) : (
          <div className="w-full h-48 flex justify-center items-center">
            <div className="relative w-32 h-44">
              {graveyard.slice(-8).map((card, index) => (
                <div 
                  key={`graveyard-${card.id}-${index}`} 
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
                    context="graveyard"
                    showOverlay={false}
                    actions={{}}
                  />
                </div>
              ))}
              {graveyard.length > 8 && (
                <div className="absolute text-gray-300 text-sm text-center py-2 bg-gray-800/50 rounded-lg border border-gray-400"
                     style={{ 
                       left: `${Math.min(8, graveyard.length) * 6}px`, 
                       top: `${Math.min(8, graveyard.length) * 4}px`,
                       zIndex: Math.min(8, graveyard.length)
                     }}>
                  +{graveyard.length - 8} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <GraveyardModal
          graveyard={graveyard}
          onReturnToHand={onReturnToHand}
          onReturnToBattlefield={onReturnToBattlefield}
          onExile={onExile}
          onShuffleIntoLibrary={onShuffleIntoLibrary}
          onReturnToField={onReturnToField}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default Graveyard; 