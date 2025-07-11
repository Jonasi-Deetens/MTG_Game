import React from 'react';
import type { Card } from '../../types/deck';

interface LibraryProps {
  remainingCards: number;
  isShuffling: boolean;
  showDeckActions: boolean;
  shouldDrawForTurn: boolean;
  isDrawingCard: boolean;
  drawingCard: Card | null;
  onDeckClick: () => void;
  onDeckHover: () => void;
  onDeckLeave: () => void;
  onDrawCard: () => void;
  onScry: (count: number) => void;
  onSearch: () => void;
  onDrawMultiple: (count: number) => void;
  onShuffleLibrary: () => void;
}

const Library: React.FC<LibraryProps> = ({
  remainingCards,
  isShuffling,
  showDeckActions,
  shouldDrawForTurn,
  isDrawingCard,
  drawingCard,
  onDeckClick,
  onDeckHover,
  onDeckLeave,
  onDrawCard,
  onScry,
  onSearch,
  onDrawMultiple,
  onShuffleLibrary
}) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`relative w-32 h-44 cursor-pointer transform hover:scale-105 transition-all duration-200 rounded-lg ${
          isShuffling ? "animate-pulse" : ""
        } ${shouldDrawForTurn && !isShuffling ? "animate-pulse" : ""}`}
          onMouseEnter={onDeckHover}
          onMouseLeave={onDeckLeave}
        onClick={onDeckClick}
      >
        {/* Enhanced MTG Card Back */}
        <div
          className={`w-full h-full bg-amber-800 rounded-lg shadow-2xl border-2 border-orange-300 relative overflow-hidden ${
            isShuffling ? "animate-spin" : ""
          } ${shouldDrawForTurn && !isShuffling ? "shadow-[0_0_20px_rgba(255,165,0,0.6)] animate-pulse" : ""}`}
        >
          {/* MTG logo and design */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <div className="text-3xl mb-2 drop-shadow-lg">⚔️</div>
            <div className="text-xs font-bold tracking-widest drop-shadow-lg">
              MTG
            </div>
          </div>

          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-transparent to-amber-600/10"></div>

          {/* Draw for turn indicator */}
          {shouldDrawForTurn && !isShuffling && (
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 via-transparent to-orange-600/20 animate-pulse"></div>
          )}

          {/* Drawing Animation - starts from deck */}
          {isDrawingCard && drawingCard && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="animate-drawFromDeck">
                <div className="w-32 h-44 bg-white rounded-lg shadow-lg border border-gray-300 relative overflow-hidden">
                  {drawingCard.image_url ? (
                    <img
                      src={drawingCard.image_url}
                      alt={drawingCard.name}
                      className="w-full h-full rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500 text-xs">{drawingCard.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Shuffling overlay */}
          {isShuffling && (
            <div className="absolute inset-0 bg-amber-600 bg-opacity-50 rounded-lg flex items-center justify-center">
            <div className="text-white text-center">
                <div className="text-2xl mb-2 animate-bounce">🔄</div>
                <div className="font-bold text-sm">Shuffling...</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Deck Actions Overlay */}
        {showDeckActions && !isShuffling && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 z-20 bg-gray-900 rounded-lg p-3 shadow-2xl border border-green-400 min-w-48">
            <div className="text-white text-xs font-bold mb-2 text-center">Deck Actions</div>
            
            {/* Draw Actions */}
            <div className="space-y-1 mb-3">
              <div className="text-green-300 text-xs font-semibold">Draw Cards:</div>
              <div className="flex gap-1">
              <button
                onClick={onDrawCard}
                  className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
              >
                Draw 1
              </button>
              <button
                onClick={() => onDrawMultiple(2)}
                  className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
              >
                Draw 2
              </button>
              <button
                onClick={() => onDrawMultiple(3)}
                  className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
              >
                Draw 3
              </button>
              </div>
            </div>

            {/* Library Manipulation */}
            <div className="space-y-1 mb-3">
              <div className="text-purple-300 text-xs font-semibold">Library:</div>
              <div className="flex gap-1">
              <button
                onClick={() => onScry(1)}
                  className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors"
              >
                Scry 1
              </button>
              <button
                onClick={() => onScry(2)}
                  className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors"
              >
                Scry 2
              </button>
              <button
                onClick={() => onScry(3)}
                  className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors"
              >
                Scry 3
              </button>
              </div>
            </div>

            {/* Search and Shuffle */}
            <div className="space-y-1">
              <div className="text-yellow-300 text-xs font-semibold">Other:</div>
              <div className="flex gap-1">
              <button
                onClick={onSearch}
                  className="px-2 py-1 text-xs bg-yellow-600 hover:bg-yellow-500 text-white rounded transition-colors"
              >
                  Search
              </button>
              <button
                onClick={onShuffleLibrary}
                  className="px-2 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
              >
                  Shuffle
              </button>
              </div>
            </div>
          </div>
        )}

        {/* Card count */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white text-sm font-bold drop-shadow-lg">
          {remainingCards}
        </div>
      </div>
    </div>
  );
};

export default Library; 