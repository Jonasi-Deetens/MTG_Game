import React from 'react';
import { useDeck } from '../../contexts/DeckProvider';

const TargetingModal: React.FC = () => {
  const { players, activePlayerId, selectTarget, cancelTargeting, confirmTargeting, getValidTargets } = useDeck();
  
  const activePlayer = players.find(p => p.id === activePlayerId);
  if (!activePlayer || !activePlayer.targetingState.isTargeting) {
    return null;
  }

  const { currentSpell, requiredTargets, selectedTargets, targetType } = activePlayer.targetingState;
  const validTargets = getValidTargets(targetType || '', activePlayerId);

  const handleTargetClick = (targetId: string) => {
    // Always allow clicking - the selectTarget function handles toggling
    selectTarget(targetId);
  };

  const canConfirm = selectedTargets.length === requiredTargets;

  // Helper function to get display name for a target
  const getTargetDisplayName = (target: { id: string; type: string; controller: string }) => {
    if (target.type === 'player') {
      const player = players.find(p => p.id === target.id);
      return player ? player.name : `Player ${target.id}`;
    }
    
    // For creatures and lands, extract the card name from the complex ID
    if (target.type === 'creature' || target.type === 'land') {
      // The ID format is: cardId-timestamp
      const parts = target.id.split('-');
      // Remove the timestamp (last part) to get the card ID
      const cardId = parts.slice(0, -1).join('-');
      
      console.log(`Target ID: ${target.id}, Extracted card ID: ${cardId}, Type: ${target.type}`);
      
      // Find the card in any player's creatures or lands
      for (const player of players) {
        if (target.type === 'creature') {
          console.log(`Checking player ${player.name} creatures:`, player.creatures.map(c => ({ id: c.id, name: c.name })));
          const creature = player.creatures.find(c => String(c.id) === cardId);
          if (creature) {
            console.log(`Found creature: ${creature.name}`);
            return `${creature.name} (${player.name})`;
          }
        } else if (target.type === 'land') {
          console.log(`Checking player ${player.name} lands:`, player.lands.map(l => ({ id: l.id, name: l.name })));
          const land = player.lands.find(l => String(l.id) === cardId);
          if (land) {
            console.log(`Found land: ${land.name}`);
            return `${land.name} (${player.name})`;
          }
        }
      }
      
      console.log(`No card found for ID: ${cardId}`);
    }
    
    return target.id; // Fallback
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold mb-4">
          Target {currentSpell?.name}
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          Select {requiredTargets} target{requiredTargets > 1 ? 's' : ''} ({selectedTargets.length}/{requiredTargets})
        </p>

        <div className="space-y-2 mb-4">
          {validTargets.map((target) => {
            const isSelected = selectedTargets.includes(target.id);
            return (
              <button
                key={target.id}
                onClick={() => handleTargetClick(target.id)}
                className={`w-full p-3 text-left rounded border transition-colors ${
                  isSelected 
                    ? 'bg-blue-100 border-blue-500 text-blue-700' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="font-medium">
                  {target.type === 'creature' && 'Creature'}
                  {target.type === 'land' && 'Land'}
                  {target.type === 'player' && 'Player'}
                </div>
                <div className="text-sm text-gray-500">
                  {getTargetDisplayName(target)}
                </div>
              </button>
            );
          })}
        </div>

        {validTargets.length === 0 && (
          <p className="text-red-500 text-sm mb-4">
            No valid targets available.
          </p>
        )}

        <div className="flex space-x-3">
          <button
            onClick={cancelTargeting}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirmTargeting}
            disabled={!canConfirm}
            className={`flex-1 px-4 py-2 rounded transition-colors ${
              canConfirm
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default TargetingModal; 