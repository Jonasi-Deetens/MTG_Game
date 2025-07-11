import React from 'react';
import type { Card } from '../../types/deck';
import { Phase, Step } from '../../types/deck';
import MtgCard from '../MtgCard';
import Library from './Library';
import Hand from './Hand';
import Exile from './Exile';
import Graveyard from './Graveyard';
import Permanents from './Permanents';
import TargetingModal from './TargetingModal';

interface BattlefieldCard extends Card {
  placedAt: Date;
}

interface GraveyardCard extends Card {
  discardedAt: Date;
}

// ExileCard is now just Card (removed exiledAt property)
type ExileCard = Card;

interface DrawnCard extends Card {
  drawnAt: Date;
}

interface GameBoardProps {
  creatures: BattlefieldCard[];
  lands: BattlefieldCard[];
  graveyard: GraveyardCard[];
  exile: ExileCard[];
  drawnCards: DrawnCard[];
  commander: Card | null;
  remainingCards: number;
  maxHandSize: number;
  tappedCreatures: Set<string>;
  tappedLands: string[];
  isShuffling: boolean;
  showDeckActions: boolean;
  shouldDrawForTurn: boolean;
  isDrawingCard: boolean;
  drawingCard: Card | null;
  isLand: (card: Card) => boolean;
  onTapLand: (land: Card, index: number) => void;
  onUntapLand: (land: Card, index: number) => void;
  onTapCreature: (creature: BattlefieldCard, index: number) => void;
  onUntapCreature: (creature: BattlefieldCard, index: number) => void;
  onDestroyPermanent: (card: BattlefieldCard) => void;
  onExilePermanent: (card: BattlefieldCard) => void;
  onBouncePermanent: (card: BattlefieldCard) => void;
  onReturnFromGraveyard: (card: GraveyardCard) => void;
  onReturnFromGraveyardToBattlefield: (card: GraveyardCard) => void;
  onCastCommander: (card: Card) => void;
  onPlayCard: (card: DrawnCard) => void;
  onDiscardCard: (card: DrawnCard) => void;
  onExileCard: (card: DrawnCard) => void;
  onDeckClick: () => void;
  onDeckHover: () => void;
  onDeckLeave: () => void;
  onDrawCard: () => void;
  onScry: (count: number) => void;
  onSearch: () => void;
  onDrawMultiple: (count: number) => void;
  onShuffleLibrary: () => void;
  // New functions for exile and graveyard interactions
  onReturnFromExile: (card: ExileCard) => void;
  onMoveFromExileToGraveyard: (card: ExileCard) => void;
  onExileFromGraveyard: (card: GraveyardCard) => void;
  onShuffleFromGraveyard: (card: GraveyardCard) => void;
  onShuffleFromExile: (card: ExileCard) => void;
  onReturnFromExileToField: (card: ExileCard) => void;
  onReturnFromGraveyardToField: (card: GraveyardCard) => void;
  currentPhase: Phase;
  // Combat props
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

const GameBoard: React.FC<GameBoardProps> = ({
  creatures,
  lands,
  graveyard,
  exile,
  drawnCards,
  commander,
  remainingCards,
  maxHandSize,
  tappedCreatures,
  tappedLands,
  isShuffling,
  showDeckActions,
  shouldDrawForTurn,
  isDrawingCard,
  drawingCard,
  isLand,
  onTapLand,
  onUntapLand,
  onTapCreature,
  onUntapCreature,
  onDestroyPermanent,
  onExilePermanent,
  onBouncePermanent,
  onReturnFromGraveyard,
  onReturnFromGraveyardToBattlefield,
  onCastCommander,
  onPlayCard,
  onDiscardCard,
  onExileCard,
  onDeckClick,
  onDeckHover,
  onDeckLeave,
  onDrawCard,
  onScry,
  onSearch,
  onDrawMultiple,
  onShuffleLibrary,
  onReturnFromExile,
  onMoveFromExileToGraveyard,
  onExileFromGraveyard,
  onShuffleFromGraveyard,
  onShuffleFromExile,
  onReturnFromExileToField,
  onReturnFromGraveyardToField,
  currentPhase,
  currentStep,
  isActivePlayer,
  combatState,
  onDeclareAttacker,
  onDeclareBlocker,
  playerId
}) => {
  const isLandTapped = (land: Card, index: number): boolean => {
    return tappedLands.includes(`${land.id}-${index}`);
  };

  const getPhaseDisplay = (phase: Phase) => {
    const phaseInfo = {
      [Phase.BEGINNING]: { icon: '🌅', name: 'Beginning Phase', description: 'Untap, Upkeep, Draw' },
      [Phase.PRECOMBAT_MAIN]: { icon: '⚡', name: 'Precombat Main', description: 'Play spells and abilities' },
      [Phase.COMBAT]: { icon: '⚔️', name: 'Combat Phase', description: 'Attack and block' },
      [Phase.POSTCOMBAT_MAIN]: { icon: '🔮', name: 'Postcombat Main', description: 'Play spells and abilities' },
      [Phase.ENDING]: { icon: '🌙', name: 'Ending Phase', description: 'End step, Cleanup' }
    };
    return phaseInfo[phase];
  };

  const currentPhaseInfo = getPhaseDisplay(currentPhase);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Phase Context Indicator */}
      <div className="mb-4 text-center">
        <div className="inline-block bg-black bg-opacity-30 rounded-lg px-4 py-2 backdrop-blur-sm border border-green-400">
          <div className="text-white text-sm">
            <span className="text-green-300 font-semibold">Current Phase:</span>{" "}
            <span>{currentPhaseInfo.icon} {currentPhaseInfo.name} - {currentPhaseInfo.description}</span>
          </div>
        </div>
      </div>

      {/* Main Battlefield Grid */}
      <div className="grid grid-cols-16 gap-1 relative" style={{ gridTemplateRows: '1fr 16px 1fr' }}>
        {/* Command Zone - Top Left */}
        <div className="col-span-2 h-64 row-span-1 flex flex-col items-start justify-center">
          <h3 className="text-white text-lg font-bold mb-2 drop-shadow-lg">
            Command Zone
          </h3>
          {commander ? (
            <div>
              <MtgCard 
                card={commander} 
                isCommander={true}
                context="command"
                actions={{
                  play: () => onCastCommander(commander)
                }}
              />
            </div>
          ) : (
            <div className="w-32 h-44 bg-brown-600 border border-green-300 rounded-lg flex items-center justify-center border-2 border-blue-300 shadow-lg">
              <div className="text-blue-200 text-center">
                <div className="text-3xl mb-2">⚔️</div>
                <div className="text-xs font-semibold">No Commander</div>
              </div>
            </div>
          )}
        </div>

        {/* Vertical Divider - Between Command Zone and Permanents */}
        <div className="col-span-1 row-span-1 col-start-3 flex items-center justify-center">
          <div className="w-1 h-full bg-gradient-to-b from-green-400 via-green-300 to-green-400 rounded-full shadow-lg opacity-60"></div>
        </div>

        {/* Permanents - Top Center */}
        <Permanents
          creatures={creatures}
          tappedCreatures={tappedCreatures}
          onTapCreature={onTapCreature}
          onUntapCreature={onUntapCreature}
          onDestroyPermanent={onDestroyPermanent}
          onExilePermanent={onExilePermanent}
          onBouncePermanent={onBouncePermanent}
          currentPhase={currentPhase}
          currentStep={currentStep}
          isActivePlayer={isActivePlayer}
          combatState={combatState}
          onDeclareAttacker={onDeclareAttacker}
          onDeclareBlocker={onDeclareBlocker}
          playerId={playerId}
        />

        {/* Vertical Divider - Between Permanents and Library */}
        <div className="col-span-1 row-span-1 col-start-14 flex items-center justify-center">
          <div className="w-1 h-full bg-gradient-to-b from-green-400 via-green-300 to-green-400 rounded-full shadow-lg opacity-60"></div>
        </div>

        {/* Deck - Top Right */}
        <div className="col-span-2 row-span-1 col-start-15 flex flex-col items-center justify-center">
          <h3 className="text-white text-lg font-bold mb-2 drop-shadow-lg">
            Library
          </h3>
          <Library
            remainingCards={remainingCards}
            isShuffling={isShuffling}
            showDeckActions={showDeckActions}
            shouldDrawForTurn={shouldDrawForTurn}
            onDeckClick={onDeckClick}
            onDeckHover={onDeckHover}
            onDeckLeave={onDeckLeave}
            onDrawCard={onDrawCard}
            onScry={onScry}
            onSearch={onSearch}
            onDrawMultiple={onDrawMultiple}
            onShuffleLibrary={onShuffleLibrary}
            isDrawingCard={isDrawingCard}
            drawingCard={drawingCard}
          />
        </div>

        {/* Horizontal Divider - Between Top and Bottom */}
        <div className="col-span-16 row-span-1 row-start-2 flex items-center justify-center">
          <div className="h-1 w-full bg-gradient-to-r from-green-400 via-green-300 to-green-400 rounded-full shadow-lg opacity-60"></div>
        </div>

        {/* Exile - Bottom Left */}
        <div className="col-span-2 row-span-1 row-start-3 col-start-1">
          <Exile
            exile={exile}
            onReturnToHand={onReturnFromExile}
            onMoveToGraveyard={onMoveFromExileToGraveyard}
            onShuffleIntoLibrary={onShuffleFromExile}
            onReturnToField={onReturnFromExileToField}
          />
        </div>

        {/* Vertical Divider - Between Exile and Lands */}
        <div className="col-span-1 row-span-1 row-start-3 col-start-3 flex items-center justify-center">
          <div className="w-1 h-full bg-gradient-to-b from-green-400 via-green-300 to-green-400 rounded-full shadow-lg opacity-60"></div>
        </div>

        {/* Lands - Bottom Center */}
        <div className="col-span-10 h-64 row-span-1 row-start-3 col-start-4 flex flex-col items-center justify-center">
          <h3 className="text-white text-lg font-bold mb-2 drop-shadow-lg">
            🌍 Lands ({lands.length})
          </h3>
          {lands.length === 0 ? (
            <div className="w-32 h-44 bg-gradient-to-br from-green-600 to-green-500 rounded-lg flex items-center justify-center border-2 border-green-300 shadow-lg">
              <span className="text-green-200 text-xs font-semibold">
                No Lands
              </span>
            </div>
          ) : (
            <div className="w-full max-h-48 overflow-y-auto">
              <div className="flex flex-wrap" style={{ gap: '10px' }}>
                {lands.map((land, index) => (
                  <div key={`${land.id}-${index}`} className="cursor-pointer relative transform hover:scale-105 transition-transform">
                    <MtgCard
                      card={land}
                      showName={false}
                      showTimestamp={false}
                      context="battlefield"
                      isLand={isLand(land)}
                      isTapped={isLandTapped(land, index)}
                      actions={{
                        tap: () => onTapLand(land, index),
                        untap: () => onUntapLand(land, index),
                        discard: () => onDestroyPermanent(land),
                        exile: () => onExilePermanent(land),
                        returnToHand: () => onBouncePermanent(land)
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Vertical Divider - Between Lands and Graveyard */}
        <div className="col-span-1 row-span-1 row-start-3 col-start-14 flex items-center justify-center">
          <div className="w-1 h-full bg-gradient-to-b from-green-400 via-green-300 to-green-400 rounded-full shadow-lg opacity-60"></div>
        </div>

        {/* Graveyard - Bottom Right */}
        <div className="col-span-2 row-span-1 row-start-3 col-start-15">
          <Graveyard
            graveyard={graveyard}
            onReturnToHand={onReturnFromGraveyard}
            onReturnToBattlefield={onReturnFromGraveyardToBattlefield}
            onExile={onExileFromGraveyard}
            onShuffleIntoLibrary={onShuffleFromGraveyard}
            onReturnToField={onReturnFromGraveyardToField}
          />
        </div>
      </div>

      {/* Hand - Separate Row Below */}
      <div className="mt-4">
        <Hand
          drawnCards={drawnCards}
          maxHandSize={maxHandSize}
          isLand={isLand}
          canPlayLand={true}
          onPlayCard={onPlayCard}
          onDiscardCard={onDiscardCard}
          onExileCard={onExileCard}
        />
      </div>

      {/* Targeting Modal */}
      <TargetingModal />
    </div>
  );
};

export default GameBoard; 