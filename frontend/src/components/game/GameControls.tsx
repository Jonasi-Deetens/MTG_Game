import React from 'react';
import type { TurnState } from '../../types/deck';
import { Phase } from '../../types/deck';
import PhaseSystem from '../PhaseSystem';

interface GameControlsProps {
  turnState: TurnState;
  playerName: string;
  onPhaseChange: (newPhase: Phase) => void;
  onNextTurn: () => void;
  onAdvanceCombatStep?: () => void;
  player1Life?: number;
  player2Life?: number;
  player1Name?: string;
  player2Name?: string;
}

const GameControls: React.FC<GameControlsProps> = ({
  turnState,
  playerName,
  onPhaseChange,
  onNextTurn,
  onAdvanceCombatStep,
  player1Life = 40,
  player2Life = 40,
  player1Name = "Player 1",
  player2Name = "Player 2"
}) => {
  return (
    <div className="max-w-7xl mx-auto mb-4">
      <div className="flex items-center justify-between">
        {/* Player 1 Life Total - Left */}
        <div className="flex flex-col items-center bg-black bg-opacity-30 rounded-lg px-6 py-3 backdrop-blur-sm border border-green-400">
          <div className="text-white text-sm font-semibold mb-1">{player1Name}</div>
          <div className="text-3xl font-bold text-green-400">{player1Life}</div>
          <div className="text-white text-xs">HP</div>
        </div>

        {/* Centered Phase System */}
        <div className="flex-1 max-w-2xl mx-8">
          <PhaseSystem
            turnState={turnState}
            playerName={playerName}
            onPhaseChange={onPhaseChange}
            onNextTurn={onNextTurn}
            onAdvanceCombatStep={onAdvanceCombatStep}
          />
        </div>

        {/* Player 2 Life Total - Right */}
        <div className="flex flex-col items-center bg-black bg-opacity-30 rounded-lg px-6 py-3 backdrop-blur-sm border border-green-400">
          <div className="text-white text-sm font-semibold mb-1">{player2Name}</div>
          <div className="text-3xl font-bold text-green-400">{player2Life}</div>
          <div className="text-white text-xs">HP</div>
        </div>
      </div>
    </div>
  );
};

export default GameControls; 