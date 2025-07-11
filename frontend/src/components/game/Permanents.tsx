import React from 'react';
import type { Card } from '../../types/deck';
import { Phase, Step } from '../../types/deck';
import MtgCard from '../MtgCard';

interface BattlefieldCard extends Card {
  placedAt: Date;
  damage?: number;
}

interface PermanentsProps {
  creatures: BattlefieldCard[];
  tappedCreatures: Set<string>;
  onTapCreature: (creature: BattlefieldCard, index: number) => void;
  onUntapCreature: (creature: BattlefieldCard, index: number) => void;
  onDestroyPermanent: (card: BattlefieldCard) => void;
  onExilePermanent: (card: BattlefieldCard) => void;
  onBouncePermanent: (card: BattlefieldCard) => void;
  // Combat props
  currentPhase?: Phase;
  currentStep?: Step;
  isActivePlayer?: boolean;
  combatState?: {
    attackers: string[];
    blockers: { [attackerId: string]: string[] };
  };
  onDeclareAttacker?: (creatureIndex: number) => void;
  onDeclareBlocker?: (blockerIndex: number) => void;
  // Player ID for activated abilities
  playerId?: string;
}

const Permanents: React.FC<PermanentsProps> = ({
  creatures,
  tappedCreatures,
  onTapCreature,
  onUntapCreature,
  onDestroyPermanent,
  onExilePermanent,
  onBouncePermanent,
  currentPhase,
  currentStep,
  isActivePlayer,
  combatState,
  onDeclareAttacker,
  onDeclareBlocker,
  playerId
}) => {
  const isCreatureTapped = (creature: BattlefieldCard, index: number): boolean => {
    return tappedCreatures.has(`${creature.id}-${index}`);
  };

  const isAttacking = (creature: BattlefieldCard, index: number): boolean => {
    return combatState?.attackers.includes(`${creature.id}-${index}`) || false;
  };

  const canAttack = (creature: BattlefieldCard, index: number): boolean => {
    return currentPhase === Phase.COMBAT && 
           currentStep === Step.DECLARE_ATTACKERS && 
           isActivePlayer === true && 
           !isCreatureTapped(creature, index) &&
           !isAttacking(creature, index);
  };

  const canBlock = (creature: BattlefieldCard, index: number): boolean => {
    return currentPhase === Phase.COMBAT && 
           currentStep === Step.DECLARE_BLOCKERS && 
           isActivePlayer === false && 
           !isCreatureTapped(creature, index);
  };

  return (
    <div className="col-span-10 h-64 row-span-1 col-start-4 flex flex-col items-center justify-center">
      <h3 className="text-white text-lg font-bold mb-2 drop-shadow-lg flex items-center">
        <span className="mr-2">🐉</span>
        Permanents ({creatures.length})
      </h3>
      {creatures.length === 0 ? (
        <div className="w-32 h-44 bg-gradient-to-br from-green-600 to-green-500 rounded-lg flex items-center justify-center border-2 border-green-300 shadow-lg">
          <span className="text-green-200 text-xs font-semibold">
            No Permanents
          </span>
        </div>
      ) : (
        <div className="w-full max-h-48 overflow-y-auto">
          <div className="flex flex-wrap" style={{ gap: '10px' }}>
            {creatures.map((creature, index) => (
              <div key={`${creature.id}-${index}`}>
                <MtgCard
                  card={creature}
                  showName={false}
                  showTimestamp={false}
                  context="battlefield"
                  isTapped={isCreatureTapped(creature, index)}
                  isAttacking={isAttacking(creature, index)}
                  canAttack={canAttack(creature, index)}
                  canBlock={canBlock(creature, index)}
                  damage={creature.damage}
                  playerId={playerId}
                  actions={{
                    discard: () => onDestroyPermanent(creature),
                    exile: () => onExilePermanent(creature),
                    returnToHand: () => onBouncePermanent(creature),
                    tap: () => onTapCreature(creature, index),
                    untap: () => onUntapCreature(creature, index),
                    attack: onDeclareAttacker ? () => onDeclareAttacker(index) : undefined,
                    block: onDeclareBlocker ? () => onDeclareBlocker(index) : undefined
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Permanents; 