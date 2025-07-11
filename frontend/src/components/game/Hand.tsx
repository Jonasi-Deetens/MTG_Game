import React from 'react';
import type { Card } from '../../types/deck';
import MtgCard from '../MtgCard';

interface DrawnCard extends Card {
  drawnAt: Date;
}

interface HandProps {
  drawnCards: DrawnCard[];
  maxHandSize: number;
  isLand: (card: Card) => boolean;
  canPlayLand: boolean;
  onPlayCard: (card: DrawnCard) => void;
  onDiscardCard: (card: DrawnCard) => void;
  onExileCard: (card: DrawnCard) => void;
}

const Hand: React.FC<HandProps> = ({
  drawnCards,
  maxHandSize,
  isLand,
  canPlayLand,
  onPlayCard,
  onDiscardCard,
  onExileCard
}) => {
  return (
    <div className="col-span-16 h-64 row-span-1 row-start-4 flex flex-col items-center justify-center">
      <h3 className="text-white text-lg font-bold mb-2 drop-shadow-lg flex items-center">
        <span className="mr-2">🃏</span>
        Hand ({drawnCards.length}/{maxHandSize})
        {drawnCards.length > maxHandSize && (
          <span className="ml-2 text-red-400 text-sm animate-pulse">
            ⚠️ Over limit
          </span>
        )}
      </h3>
      {drawnCards.length === 0 ? (
        <div className="w-32 h-44 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg flex items-center justify-center border-2 border-blue-300 shadow-lg">
          <span className="text-blue-200 text-xs font-semibold">
            No Cards
          </span>
        </div>
      ) : (
        <div className="w-full max-h-48 overflow-y-auto">
          <div className="grid grid-cols-8 gap-2">
            {drawnCards.slice(0, 16).map((card, index) => (
              <div
                key={`${card.id}-${index}`}
                className="cursor-pointer"
              >
                <MtgCard
                  card={card}
                  showName={false}
                  showTimestamp={false}
                  context="hand"
                  isLand={isLand(card)}
                  canPlayLand={canPlayLand}
                  actions={{
                    play: () => onPlayCard(card),
                    discard: () => onDiscardCard(card),
                    exile: () => onExileCard(card)
                  }}
                />
              </div>
            ))}
            {drawnCards.length > 16 && (
              <div className="col-span-8 text-gray-300 text-sm text-center py-2 bg-gray-800/50 rounded-lg border border-gray-400">
                +{drawnCards.length - 16} more cards
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Hand; 