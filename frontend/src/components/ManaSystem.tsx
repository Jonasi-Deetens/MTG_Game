import React from 'react';
import type { TurnState } from '../types/deck';

interface ManaSystemProps {
  turnState: TurnState;
  onSpendMana: (color: string) => void;
}

const ManaSystem: React.FC<ManaSystemProps> = ({
  turnState,
  onSpendMana
}) => {
  const manaColors = [
    { key: 'white', name: 'White', symbol: '⚪', color: 'text-white' },
    { key: 'blue', name: 'Blue', symbol: '🔵', color: 'text-blue-400' },
    { key: 'black', name: 'Black', symbol: '⚫', color: 'text-gray-800' },
    { key: 'red', name: 'Red', symbol: '🔴', color: 'text-red-500' },
    { key: 'green', name: 'Green', symbol: '🟢', color: 'text-green-500' },
    { key: 'colorless', name: 'Colorless', symbol: '⚪', color: 'text-gray-400' }
  ];

  const totalMana = Object.values(turnState.manaPool).reduce((sum, amount) => sum + amount, 0);

  return (
    <div className="bg-black bg-opacity-40 rounded-lg p-3 backdrop-blur-sm border border-green-400">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white text-sm font-bold">Mana Pool</h3>
      </div>

      {/* Mana Display - More Compact */}
      <div className="grid grid-cols-3 gap-1 mb-2">
        {manaColors.map(({ key, name, symbol, color }) => (
          <div key={key} className="bg-gray-800 bg-opacity-50 rounded p-1 text-center">
            <div className={`text-xs font-bold ${color}`}>{symbol}</div>
            <div className="text-white text-xs font-semibold">{name}</div>
            <div className="text-white text-sm font-bold">{turnState.manaPool[key as keyof typeof turnState.manaPool]}</div>
            {turnState.manaPool[key as keyof typeof turnState.manaPool] > 0 && (
              <button
                onClick={() => onSpendMana(key)}
                className="mt-0.5 bg-red-600 text-white text-xs px-1 py-0.5 rounded hover:bg-red-500 transition-colors"
              >
                Spend
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Total Mana - More Compact */}
      <div className="text-center mb-1">
        <div className="text-white text-xs font-semibold">Total Mana</div>
        <div className="text-white text-lg font-bold">{totalMana}</div>
      </div>

      {/* Land Status - More Compact */}
      <div className="text-center">
        <div className={`text-xs font-semibold ${
          turnState.landsTapped ? 'text-red-300' : 'text-green-300'
        }`}>
          Lands: {turnState.landsTapped ? 'Tapped' : 'Untapped'}
        </div>
      </div>
    </div>
  );
};

export default ManaSystem; 