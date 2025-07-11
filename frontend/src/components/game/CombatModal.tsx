import React from 'react';
import type { Card } from '../../types/deck';
import { Phase } from '../../types/deck';
import MtgCard from '../MtgCard';

interface BattlefieldCard extends Card {
  placedAt: Date;
}

interface CombatModalProps {
  isOpen: boolean;
  onClose: () => void;
  attackingPlayer: {
    id: string;
    name: string;
    creatures: BattlefieldCard[];
    tappedCreatures: Set<string>;
    combatState: {
      attackers: string[];
    };
  };
  defendingPlayer: {
    id: string;
    name: string;
    creatures: BattlefieldCard[];
    tappedCreatures: Set<string>;
    combatState: {
      blockers: { [attackerId: string]: string[] };
    };
  };
  currentPhase: Phase;
  activePlayerId: string;
  onDeclareAttacker: (playerId: string, creatureIndex: number) => void;
  onDeclareBlocker: (defenderPlayerId: string, attackerPlayerId: string, attackerIndex: number, blockerIndex: number) => void;
  onResolveCombat: (attackingPlayerId: string, defendingPlayerId: string) => void;
  isCreature: (card: Card) => boolean;
}

const CombatModal: React.FC<CombatModalProps> = ({
  isOpen,
  onClose,
  attackingPlayer,
  defendingPlayer,
  currentPhase,
  activePlayerId,
  onDeclareAttacker,
  onDeclareBlocker,
  onResolveCombat,
  isCreature
}) => {


  if (!isOpen || currentPhase !== Phase.COMBAT) return null;

  // For testing: allow the active player to control both attackers and blockers
  const isAttackingPhase = attackingPlayer.id === activePlayerId;
  const isBlockingPhase = true; // Always allow blocking for testing

  const getCreatureInstanceId = (creature: Card, index: number) => `${creature.id}-${index}`;

  const isCreatureTapped = (creature: Card, index: number, playerTappedCreatures: Set<string>) => {
    return playerTappedCreatures.has(getCreatureInstanceId(creature, index));
  };

  const isCreatureAttacking = (creature: Card, index: number) => {
    return attackingPlayer.combatState.attackers.includes(getCreatureInstanceId(creature, index));
  };



  const isCreatureBlocking = (creature: Card, index: number) => {
    const blockerInstanceId = getCreatureInstanceId(creature, index);
    return Object.values(defendingPlayer.combatState.blockers).some(blockers => 
      blockers.includes(blockerInstanceId)
    );
  };

  const handleAttackerClick = (creatureIndex: number) => {
    if (isAttackingPhase) {
      onDeclareAttacker(attackingPlayer.id, creatureIndex);
    }
  };

  const handleBlockerClick = (blockerIndex: number) => {
    if (isBlockingPhase) {
      // Only allow blocking if there are attackers
      if (attackingPlayer.combatState.attackers.length > 0) {
        const firstAttackerId = attackingPlayer.combatState.attackers[0];
        const [, attackerIndexStr] = firstAttackerId.split('-');
        const attackerIndex = parseInt(attackerIndexStr);
        onDeclareBlocker(defendingPlayer.id, attackingPlayer.id, attackerIndex, blockerIndex);
      }
    }
  };



  const handleResolveCombat = () => {
    onResolveCombat(attackingPlayer.id, defendingPlayer.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-white text-xl font-bold">Combat Phase</h2>
            <div className="text-sm text-gray-300">
              {isAttackingPhase && "Active player declares attackers"}
              {isBlockingPhase && "Active player can also declare blockers (testing mode)"}
              {!isAttackingPhase && !isBlockingPhase && "Combat ready to resolve"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Attacking Player */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-white text-lg font-semibold mb-3">
              {attackingPlayer.name} - Attackers
              {isAttackingPhase && <span className="ml-2 text-green-400">(Your Turn)</span>}
            </h3>
            
            {attackingPlayer.creatures.filter(isCreature).length === 0 ? (
              <div className="text-gray-400 text-center py-4">No creatures to attack with</div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {attackingPlayer.creatures
                  .filter(isCreature)
                  .map((creature) => {
                    const originalIndex = attackingPlayer.creatures.indexOf(creature);
                    const isTapped = isCreatureTapped(creature, originalIndex, attackingPlayer.tappedCreatures);
                    const isAttacking = isCreatureAttacking(creature, originalIndex);
                    
                    return (
                      <div
                        key={`${creature.id}-${originalIndex}`}
                        className={`relative cursor-pointer transform transition-all ${
                          isAttacking ? 'ring-2 ring-red-400 scale-105' : ''
                        } ${isTapped ? 'opacity-50' : ''}`}
                        onClick={() => handleAttackerClick(originalIndex)}
                      >
                        <MtgCard
                          card={creature}
                          showName={true}
                          showTimestamp={false}
                          context="battlefield"
                          isTapped={isTapped}
                          actions={{}}
                        />
                        {isAttacking && (
                          <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded">
                            Attacking
                          </div>
                        )}
                        {isTapped && (
                          <div className="absolute top-0 left-0 bg-gray-500 text-white text-xs px-1 rounded">
                            Tapped
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Defending Player */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-white text-lg font-semibold mb-3">
              {defendingPlayer.name} - Blockers
              {isBlockingPhase && <span className="ml-2 text-green-400">(Your Turn)</span>}
            </h3>
            
            {defendingPlayer.creatures.filter(isCreature).length === 0 ? (
              <div className="text-gray-400 text-center py-4">No creatures to block with</div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {defendingPlayer.creatures
                  .filter(isCreature)
                  .map((creature) => {
                    const originalIndex = defendingPlayer.creatures.indexOf(creature);
                    const isTapped = isCreatureTapped(creature, originalIndex, defendingPlayer.tappedCreatures);
                    const isBlocking = isCreatureBlocking(creature, originalIndex);
                    
                    return (
                      <div
                        key={`${creature.id}-${originalIndex}`}
                        className={`relative cursor-pointer transform transition-all ${
                          isBlocking ? 'ring-2 ring-blue-400 scale-105' : ''
                        } ${isTapped ? 'opacity-50' : ''}`}
                        onClick={() => handleBlockerClick(originalIndex)}
                      >
                        <MtgCard
                          card={creature}
                          showName={true}
                          showTimestamp={false}
                          context="battlefield"
                          isTapped={isTapped}
                          actions={{}}
                        />
                        {isBlocking && (
                          <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-1 rounded">
                            Blocking
                          </div>
                        )}
                        {isTapped && (
                          <div className="absolute top-0 left-0 bg-gray-500 text-white text-xs px-1 rounded">
                            Tapped
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Combat Status */}
        <div className="mt-6 bg-gray-700 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-2">Combat Status</h4>
          
          {/* Attackers */}
          <div className="mb-4">
            <h5 className="text-red-300 font-semibold">Attackers:</h5>
            {attackingPlayer.combatState.attackers.length === 0 ? (
              <div className="text-gray-400">No attackers declared</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {attackingPlayer.combatState.attackers.map(attackerId => {
                  const [, indexStr] = attackerId.split('-');
                  const index = parseInt(indexStr);
                  const creature = attackingPlayer.creatures[index];
                  
                  if (!creature) return null;
                  
                  return (
                    <div key={attackerId} className="bg-red-600 rounded px-2 py-1 text-white text-sm">
                      {creature.name} ({creature.power || '0'}/{creature.toughness || '0'})
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Blockers */}
          <div className="mb-4">
            <h5 className="text-blue-300 font-semibold">Blockers:</h5>
            {Object.keys(defendingPlayer.combatState.blockers).length === 0 ? (
              <div className="text-gray-400">No blockers declared</div>
            ) : (
              <div className="space-y-2">
                {Object.entries(defendingPlayer.combatState.blockers).map(([attackerId, blockerIds]) => {
                  const [, indexStr] = attackerId.split('-');
                  const index = parseInt(indexStr);
                  const attacker = attackingPlayer.creatures[index];
                  
                  if (!attacker) return null;
                  
                  return (
                    <div key={attackerId} className="bg-gray-600 rounded p-2">
                      <div className="text-red-300 font-semibold">
                        {attacker.name} ({attacker.power || '0'}/{attacker.toughness || '0'})
                      </div>
                      <div className="text-blue-300 ml-4">
                                                 Blocked by: {blockerIds.map(blockerId => {
                           const [, blockerIndexStr] = blockerId.split('-');
                           const blockerIndex = parseInt(blockerIndexStr);
                           const blocker = defendingPlayer.creatures[blockerIndex];
                           return blocker ? `${blocker.name} (${blocker.power || '0'}/${blocker.toughness || '0'})` : '';
                         }).join(', ')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleResolveCombat}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500"
          >
            Resolve Combat
          </button>
        </div>
      </div>
    </div>
  );
};

export default CombatModal; 