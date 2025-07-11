import React from 'react';
import type { Deck, TurnState } from '../../types/deck';

interface GameHeaderProps {
  deck: Deck | null;
  turnState: TurnState;
  onShuffleDeck: () => void;
  onResetSimulation: () => void;
  onBack: () => void;
  onUpdateMaxHandSize: (newSize: number) => void;
  onSpendMana: (color: string) => void;
  isActivePlayer?: boolean;
}

const GameHeader: React.FC<GameHeaderProps> = ({
  deck,
  turnState,
  onShuffleDeck,
  onResetSimulation,
  onBack,
  onUpdateMaxHandSize,
  onSpendMana,
  isActivePlayer = false
}) => {
  if (!deck) return null;

  const manaColors = [
    { key: 'white', symbol: '⚪', color: 'text-white' },
    { key: 'blue', symbol: '🔵', color: 'text-blue-400' },
    { key: 'black', symbol: '⚫', color: 'text-gray-800' },
    { key: 'red', symbol: '🔴', color: 'text-red-500' },
    { key: 'green', symbol: '🟢', color: 'text-green-500' },
    { key: 'colorless', symbol: '⚪', color: 'text-gray-400' }
  ];

  return (
    <div className="max-w-7xl mx-auto mb-6">
      <div className={`flex justify-between items-center bg-black bg-opacity-30 rounded-lg p-4 backdrop-blur-sm border transition-all duration-300 ${
        isActivePlayer 
          ? 'border-yellow-400 shadow-lg shadow-yellow-400/30' 
          : 'border-green-400'
      }`}>
        <div className="flex items-center space-x-6">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                {deck.name}
              </h1>
              {isActivePlayer && (
                <div className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold">
                  ACTIVE PLAYER
                </div>
              )}
            </div>
            <p className="text-green-200 text-sm">
              Competitive EDH Battlefield
            </p>
          </div>
          
          {/* Mana Pool Display */}
          <div className="bg-black bg-opacity-40 rounded-lg p-2 backdrop-blur-sm border border-green-400">
            <div className="text-white text-xs font-bold mb-1 text-center">Mana Pool</div>
            <div className="grid grid-cols-3 gap-1">
              {manaColors.map(({ key, symbol, color }) => (
                <div key={key} className="text-center">
                  <div className={`text-xs font-bold ${color}`}>{symbol}</div>
                  <div className="text-white text-xs font-bold">{turnState.manaPool[key as keyof typeof turnState.manaPool]}</div>
                  {turnState.manaPool[key as keyof typeof turnState.manaPool] > 0 && (
                    <button
                      onClick={() => onSpendMana(key)}
                      className="mt-0.5 bg-red-600 text-white text-xs px-1 py-0.5 rounded hover:bg-red-500 transition-colors"
                    >
                      -
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex space-x-3">
          {/* Hand Size Control */}
          <div className="flex items-center space-x-2 bg-black bg-opacity-30 rounded-lg px-3 py-2 border border-green-400">
            <label className="text-white text-sm font-semibold">Max Hand:</label>
            <input
              type="number"
              min="1"
              max="20"
              value={turnState.maxHandSize}
              onChange={(e) => onUpdateMaxHandSize(parseInt(e.target.value) || 7)}
              className="w-12 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-center text-sm"
            />
          </div>
          <button
            onClick={onShuffleDeck}
            className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-purple-500 hover:to-purple-400 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Shuffle Deck
          </button>
          <button
            onClick={onResetSimulation}
            className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white px-4 py-2 rounded-lg hover:from-yellow-500 hover:to-yellow-400 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Reset Battlefield
          </button>
          <button
            onClick={onBack}
            className="bg-gradient-to-r from-gray-700 to-gray-600 text-white px-4 py-2 rounded-lg hover:from-gray-600 hover:to-gray-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Back to Decks
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameHeader; 