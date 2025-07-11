import React from 'react';
import { Phase, Step } from '../types/deck';
import type { PhaseInfo, TurnState } from '../types/deck';

interface PhaseSystemProps {
  turnState: TurnState;
  playerName: string;
  onPhaseChange: (phase: Phase) => void;
  onNextTurn: () => void;
  onAdvanceCombatStep?: () => void;
}

const phaseData: PhaseInfo[] = [
  {
    id: Phase.BEGINNING,
    name: 'Beginning',
    icon: '🌅',
    description: 'Untap, Upkeep, Draw',
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: Phase.PRECOMBAT_MAIN,
    name: 'Precombat Main',
    icon: '⚡',
    description: 'Play spells and abilities',
    color: 'from-green-500 to-green-600'
  },
  {
    id: Phase.COMBAT,
    name: 'Combat',
    icon: '⚔️',
    description: 'Attack and block',
    color: 'from-red-500 to-red-600'
  },
  {
    id: Phase.POSTCOMBAT_MAIN,
    name: 'Postcombat Main',
    icon: '🔮',
    description: 'Play spells and abilities',
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: Phase.ENDING,
    name: 'Ending',
    icon: '🌙',
    description: 'End step, Cleanup',
    color: 'from-gray-500 to-gray-600'
  }
];

const PhaseSystem: React.FC<PhaseSystemProps> = ({
  turnState,
  playerName,
  onPhaseChange,
  onNextTurn,
  onAdvanceCombatStep
}) => {
  const currentPhaseInfo = phaseData.find(phase => phase.id === turnState.currentPhase);

  // Get step display info
  const getStepDisplay = (step: Step) => {
    const stepInfo = {
      [Step.UNTAP]: { name: 'Untap', icon: '🔄', color: 'from-blue-400 to-blue-500' },
      [Step.UPKEEP]: { name: 'Upkeep', icon: '⏰', color: 'from-yellow-400 to-yellow-500' },
      [Step.DRAW]: { name: 'Draw', icon: '📖', color: 'from-green-400 to-green-500' },
      [Step.BEGINNING_OF_COMBAT]: { name: 'Begin Combat', icon: '⚔️', color: 'from-red-400 to-red-500' },
      [Step.DECLARE_ATTACKERS]: { name: 'Declare Attackers', icon: '🗡️', color: 'from-red-500 to-red-600' },
      [Step.DECLARE_BLOCKERS]: { name: 'Declare Blockers', icon: '🛡️', color: 'from-red-600 to-red-700' },
      [Step.FIRST_STRIKE_DAMAGE]: { name: 'First Strike', icon: '⚡', color: 'from-orange-400 to-orange-500' },
      [Step.COMBAT_DAMAGE]: { name: 'Combat Damage', icon: '💥', color: 'from-red-700 to-red-800' },
      [Step.END_OF_COMBAT]: { name: 'End Combat', icon: '🏁', color: 'from-gray-400 to-gray-500' },
      [Step.END_STEP]: { name: 'End Step', icon: '🌙', color: 'from-purple-400 to-purple-500' },
      [Step.CLEANUP]: { name: 'Cleanup', icon: '🧹', color: 'from-gray-500 to-gray-600' }
    };
    return stepInfo[step];
  };

  const currentStepInfo = getStepDisplay(turnState.currentStep);

  return (
    <div className="bg-black bg-opacity-40 rounded-lg p-3 backdrop-blur-sm border border-green-400">
      {/* Turn Counter and Current Phase/Step - More Compact */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-center">
          <div className="text-white text-lg font-bold drop-shadow-lg">
            Turn {turnState.turnNumber}
          </div>
          <div className="text-green-200 text-xs">
            {turnState.isActivePlayer ? `${playerName}'s Turn` : 'Opponent\'s Turn'}
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-1">
        {currentPhaseInfo && (
            <div 
              key={`phase-${turnState.currentPhase}`}
              className={`bg-gradient-to-r ${currentPhaseInfo.color} text-white p-2 rounded-lg shadow-lg min-w-[100px]`}
            >
              <div className="flex items-center space-x-1">
                <div className="text-base">{currentPhaseInfo.icon}</div>
              <div>
                  <div className="font-bold text-xs">{currentPhaseInfo.name}</div>
                <div className="text-xs opacity-90">{currentPhaseInfo.description}</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Show current step for combat phase */}
          {turnState.currentPhase === Phase.COMBAT && currentStepInfo && (
            <div 
              className={`bg-gradient-to-r ${currentStepInfo.color} text-white p-1 rounded text-xs font-semibold`}
            >
              <div className="flex items-center space-x-1">
                <span>{currentStepInfo.icon}</span>
                <span>{currentStepInfo.name}</span>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Phase Selection - More Compact */}
      <div className="mb-3">
        <div className="text-white text-xs font-semibold mb-1 text-center">Select Phase</div>
        <div className="grid grid-cols-5 gap-1">
          {phaseData.map((phase) => {
            // Determine if this phase should be clickable (only current and future phases)
            const phaseOrder = [Phase.BEGINNING, Phase.PRECOMBAT_MAIN, Phase.COMBAT, Phase.POSTCOMBAT_MAIN, Phase.ENDING];
            const currentPhaseIndex = phaseOrder.indexOf(turnState.currentPhase);
            const phaseIndex = phaseOrder.indexOf(phase.id);
            const isClickable = phaseIndex >= currentPhaseIndex;
            
            return (
            <button
              key={phase.id}
                onClick={() => {
                  if (isClickable) {
                    onPhaseChange(phase.id);
                  }
                }}
                className={`p-1 rounded transition-all duration-200 transform ${
                turnState.currentPhase === phase.id
                  ? `bg-gradient-to-r ${phase.color} text-white shadow-lg`
                    : isClickable
                    ? 'bg-gray-700 bg-opacity-50 text-gray-300 hover:bg-gray-600 hover:text-white hover:scale-105'
                    : 'bg-gray-800 bg-opacity-30 text-gray-500 cursor-not-allowed'
              }`}
                title={isClickable ? `${phase.name}: ${phase.description}` : `${phase.name}: Cannot go backwards`}
                disabled={!isClickable}
            >
                <div className="text-sm mb-0.5">{phase.icon}</div>
              <div className="text-xs font-semibold leading-tight">{phase.name}</div>
            </button>
            );
          })}
        </div>
      </div>

      {/* Turn Status and Next Turn Button - More Compact */}
      <div className="flex items-center justify-between">
        {/* Turn Status Indicators */}
        <div className="flex space-x-2 text-xs">
          <div className={`bg-gray-800 bg-opacity-50 rounded p-1 text-center min-w-[35px] ${
            turnState.hasDrawnForTurn ? 'ring-1 ring-green-400 ring-opacity-75' : ''
          }`}>
            <div className="text-green-300 font-semibold text-xs">Draw</div>
            <div className={`text-white text-xs ${turnState.hasDrawnForTurn ? 'text-green-400' : 'text-red-400'}`}>
              {turnState.hasDrawnForTurn ? '✓' : '✗'}
            </div>
          </div>
          <div className={`bg-gray-800 bg-opacity-50 rounded p-1 text-center min-w-[35px] ${
            turnState.hasPlayedLand ? 'ring-1 ring-green-400 ring-opacity-75' : ''
          }`}>
            <div className="text-green-300 font-semibold text-xs">Land</div>
            <div className={`text-white text-xs ${turnState.hasPlayedLand ? 'text-green-400' : 'text-red-400'}`}>
              {turnState.hasPlayedLand ? '✓' : '✗'}
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {/* Advance Combat Step Button - Only show during combat phase */}
          {turnState.currentPhase === Phase.COMBAT && onAdvanceCombatStep && (
            <button
              onClick={onAdvanceCombatStep}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-2 py-1 rounded text-xs font-semibold hover:from-red-400 hover:to-red-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Next Step
            </button>
          )}
        
        <button
          onClick={onNextTurn}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-2 py-1 rounded text-xs font-semibold hover:from-yellow-400 hover:to-yellow-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Next Turn
        </button>
        </div>
      </div>
    </div>
  );
};

export default PhaseSystem; 