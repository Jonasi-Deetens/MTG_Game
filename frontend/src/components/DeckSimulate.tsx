import React, { useEffect } from 'react';
import { Phase, Step } from "../types/deck";
import ScryModal from './game/ScryModal';
import SearchModal from './game/SearchModal';
import GameBoard from './game/GameBoard';
import GameHeader from './game/GameHeader';
import GameControls from './game/GameControls';
import StackDisplay from './game/StackDisplay';
import Hand from './game/Hand';
import Exile from './game/Exile';
import Graveyard from './game/Graveyard';
import Library from './game/Library';
import MtgCard from './MtgCard';
import ExampleCardAdder from './ExampleCardAdder';

import { useDeck } from '../contexts/DeckProvider';

interface DeckSimulateProps {
  deckId: number;
  onBack: () => void;
}

const DeckSimulate = ({ deckId, onBack }: DeckSimulateProps) => {
  
  const {
    players,
    activePlayerId,
    loadDeck,
    drawCard,
    drawMultipleCards,
    playCard,
    discardCard,
    exileCard,
    destroyPermanent,
    exilePermanent,
    bouncePermanent,
    tapLand,
    untapLand,
    tapCreature,
    untapCreature,
    returnFromGraveyard,
    returnFromGraveyardToBattlefield,
    returnFromGraveyardToField,
    returnFromExile,
    moveFromExileToGraveyard,
    exileFromGraveyard,
    shuffleFromGraveyard,
    shuffleFromExile,
    returnFromExileToField,
    castCommander,
    changePhase,
    nextTurn,
    advanceCombatStep,
    shuffleDeck,
    scry,
    searchLibrary,
    selectCardFromSearch,
    handleScryDecision,
    getPlayer,
    isLand,
    toggleShowDeckActions,
    toggleSearch,
    closeScry,
    closeSearch,
    spendMana,
    resetSimulation,
    updateMaxHandSize,
    declareAttacker,
    declareBlocker,
    stack,
    passPriority
  } = useDeck();

  const player = getPlayer(activePlayerId);

  // Get all players for multi-player view
  const allPlayers = players.filter(p => p.deck !== null); // Only show players with loaded decks



  // Helper function for phase display
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

  useEffect(() => {
    if (player && !player.deck) {
      loadDeck(activePlayerId, deckId);
    }
  }, [activePlayerId, deckId, player, loadDeck]);

  if (!player) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">Player not found</p>
        <button
          onClick={onBack}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!player.deck) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 p-4">
      {/* Stack Display */}
      <StackDisplay
        stack={stack}
        priorityPlayerId={activePlayerId} // TODO: Get actual priority player
        activePlayerId={activePlayerId}
        onPass={passPriority}
        canRespond={stack.length > 0}
      />

      {/* Example Card Adder for Testing */}
      <ExampleCardAdder />

      {/* Opponent (Player 2) - Top */}
      <div className="mb-4">
        {/* Load Deck Button for Player 2 */}
        {!allPlayers[1]?.deck && (
          <div className="mb-4 text-center">
            <button
              onClick={() => loadDeck('player2', deckId)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Load Same Deck for Player 2
            </button>
          </div>
        )}
        
        {/* Opponent's Game Board - Reversed Layout but Cards Stay Readable */}
        <div>
          {/* Opponent's Hand - Top */}
          <div className="mb-4">
            <Hand
              drawnCards={allPlayers[1]?.drawnCards || []}
              maxHandSize={allPlayers[1]?.turnState.maxHandSize || 7}
              isLand={isLand}
              canPlayLand={true}
              onPlayCard={(card) => playCard(allPlayers[1]?.id || '', card)}
              onDiscardCard={(card) => discardCard(allPlayers[1]?.id || '', card)}
              onExileCard={(card) => exileCard(allPlayers[1]?.id || '', card)}
            />
      </div>

          {/* Opponent's Main Battlefield Grid - Reversed Layout */}
      <div className="max-w-7xl mx-auto">
        {/* Phase Context Indicator */}
        <div className="mb-4 text-center">
          <div className="inline-block bg-black bg-opacity-30 rounded-lg px-4 py-2 backdrop-blur-sm border border-green-400">
            <div className="text-white text-sm">
                  <span className="text-green-300 font-semibold">Opponent's Phase:</span>{" "}
                  <span>{getPhaseDisplay(allPlayers[1]?.turnState.currentPhase || Phase.BEGINNING).icon} {getPhaseDisplay(allPlayers[1]?.turnState.currentPhase || Phase.BEGINNING).name}</span>
            </div>
          </div>
        </div>

            {/* Main Battlefield Grid - Reversed for Opponent */}
            <div className="grid grid-cols-16 gap-1 relative" style={{ gridTemplateRows: '1fr 16px 1fr' }}>
              {/* Graveyard - Top Left (opponent's perspective) */}
          <div className="col-span-2 h-64 row-span-1 flex flex-col items-start justify-center">
                <Graveyard
                  graveyard={allPlayers[1]?.graveyard || []}
                  onReturnToHand={(card) => returnFromGraveyard(allPlayers[1]?.id || '', card)}
                  onReturnToBattlefield={(card) => returnFromGraveyardToBattlefield(allPlayers[1]?.id || '', card)}
                  onExile={(card) => exileFromGraveyard(allPlayers[1]?.id || '', card)}
                  onShuffleIntoLibrary={(card) => shuffleFromGraveyard(allPlayers[1]?.id || '', card)}
                  onReturnToField={(card) => returnFromGraveyardToField(allPlayers[1]?.id || '', card)}
                />
          </div>

              {/* Vertical Divider - Between Graveyard and Lands */}
          <div className="col-span-1 row-span-1 col-start-3 flex items-center justify-center">
            <div className="w-1 h-full bg-gradient-to-b from-green-400 via-green-300 to-green-400 rounded-full shadow-lg opacity-60"></div>
          </div>

              {/* Lands - Top Center (opponent's perspective) */}
              <div className="col-span-10 h-64 row-span-1 col-start-4 flex flex-col items-center justify-center">
                <h3 className="text-white text-lg font-bold mb-2 drop-shadow-lg">
                  🌍 Lands ({allPlayers[1]?.lands.length || 0})
            </h3>
                {(!allPlayers[1]?.lands || allPlayers[1].lands.length === 0) ? (
              <div className="w-32 h-44 bg-gradient-to-br from-green-600 to-green-500 rounded-lg flex items-center justify-center border-2 border-green-300 shadow-lg">
                <span className="text-green-200 text-xs font-semibold">
                      No Lands
                </span>
              </div>
            ) : (
              <div className="w-full max-h-48 overflow-y-auto">
                    <div className="flex flex-wrap" style={{ gap: '10px' }}>
                      {allPlayers[1].lands.map((land, index) => (
                        <div key={`${land.id}-${index}`} className="cursor-pointer relative">
                      <MtgCard
                            card={land}
                        showName={false}
                        showTimestamp={false}
                        context="battlefield"
                            isLand={isLand(land)}
                            isTapped={allPlayers[1]?.turnState.tappedLands.includes(`${land.id}-${index}`)}
                        actions={{
                              tap: () => tapLand(allPlayers[1]?.id || '', land, index),
                              untap: () => untapLand(allPlayers[1]?.id || '', land, index),
                              discard: () => destroyPermanent(allPlayers[1]?.id || '', land),
                              exile: () => exilePermanent(allPlayers[1]?.id || '', land),
                              returnToHand: () => bouncePermanent(allPlayers[1]?.id || '', land)
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

              {/* Vertical Divider - Between Lands and Exile */}
              <div className="col-span-1 row-span-1 col-start-14 flex items-center justify-center">
            <div className="w-1 h-full bg-gradient-to-b from-green-400 via-green-300 to-green-400 rounded-full shadow-lg opacity-60"></div>
          </div>

              {/* Exile - Top Right (opponent's perspective) */}
              <div className="col-span-2 row-span-1 col-start-15">
                <Exile
                  exile={allPlayers[1]?.exile || []}
                  onReturnToHand={(card) => returnFromExile(allPlayers[1]?.id || '', card)}
                  onMoveToGraveyard={(card) => moveFromExileToGraveyard(allPlayers[1]?.id || '', card)}
                  onShuffleIntoLibrary={(card) => shuffleFromExile(allPlayers[1]?.id || '', card)}
                  onReturnToField={(card) => returnFromExileToField(allPlayers[1]?.id || '', card)}
                />
                </div>

              {/* Horizontal Divider - Between Top and Bottom */}
              <div className="col-span-16 row-span-1 row-start-2 flex items-center justify-center">
                <div className="h-1 w-full bg-gradient-to-r from-green-400 via-green-300 to-green-400 rounded-full shadow-lg opacity-60"></div>
              </div>

              {/* Library - Bottom Left (opponent's perspective) */}
              <div className="col-span-2 h-64 row-span-1 row-start-3 col-start-1 flex flex-col items-center justify-center">
                <h3 className="text-white text-lg font-bold mb-2 drop-shadow-lg">
                  Library
                </h3>
                <Library
                  remainingCards={allPlayers[1] ? allPlayers[1].shuffledDeck.length - allPlayers[1].currentDeckIndex : 0}
                  isShuffling={allPlayers[1]?.isShuffling || false}
                  showDeckActions={allPlayers[1]?.showDeckActions || false}
                  shouldDrawForTurn={allPlayers[1]?.id === activePlayerId && allPlayers[1]?.turnState.currentPhase === Phase.BEGINNING && !allPlayers[1]?.turnState.hasDrawnForTurn}
                  onDeckClick={() => {
                    if (allPlayers[1]?.id === activePlayerId && allPlayers[1]?.turnState.currentPhase === Phase.BEGINNING && !allPlayers[1]?.turnState.hasDrawnForTurn) {
                      drawCard(allPlayers[1]?.id || '');
                    } else {
                      toggleShowDeckActions(allPlayers[1]?.id || '');
                    }
                  }}
                  onDeckHover={() => {}}
                  onDeckLeave={() => {}}
                  onDrawCard={() => drawCard(allPlayers[1]?.id || '')}
                  onScry={(count) => scry(allPlayers[1]?.id || '', count)}
                  onSearch={() => toggleSearch(allPlayers[1]?.id || '')}
                  onDrawMultiple={(count) => drawMultipleCards(allPlayers[1]?.id || '', count)}
                  onShuffleLibrary={() => shuffleDeck(allPlayers[1]?.id || '')}
                  isDrawingCard={allPlayers[1]?.isDrawingCard || false}
                  drawingCard={allPlayers[1]?.drawingCard || null}
                />
                  </div>

              {/* Vertical Divider - Between Library and Permanents */}
              <div className="col-span-1 row-span-1 row-start-3 col-start-3 flex items-center justify-center">
                <div className="w-1 h-full bg-gradient-to-b from-green-400 via-green-300 to-green-400 rounded-full shadow-lg opacity-60"></div>
                  </div>

              {/* Permanents - Bottom Center (opponent's perspective) */}
              <div className="col-span-10 h-64 row-span-1 row-start-3 col-start-4 flex flex-col items-center justify-center">
                <h3 className="text-white text-lg font-bold mb-2 drop-shadow-lg">
                  🐉 Creatures ({allPlayers[1]?.creatures.length || 0})
            </h3>
                {(!allPlayers[1]?.creatures || allPlayers[1].creatures.length === 0) ? (
                  <div className="w-32 h-44 bg-gradient-to-br from-red-600 to-red-500 rounded-lg flex items-center justify-center border-2 border-red-300 shadow-lg">
                    <span className="text-red-200 text-xs font-semibold">
                      No Creatures
                </span>
              </div>
            ) : (
              <div className="w-full max-h-48 overflow-y-auto">
                    <div className="flex flex-wrap" style={{ gap: '10px' }}>
                      {allPlayers[1].creatures.map((creature, index) => (
                        <div key={`${creature.id}-${index}`}>
                      <MtgCard
                            card={creature}
                        showName={false}
                        showTimestamp={false}
                        context="battlefield"
                            isTapped={allPlayers[1]?.tappedCreatures.has(`${creature.id}-${index}`)}
                            isAttacking={allPlayers[1]?.combatState?.attackers.includes(`${creature.id}-${index}`)}
                            canAttack={allPlayers[1]?.turnState.currentPhase === Phase.COMBAT && 
                                     allPlayers[1]?.turnState.currentStep === Step.DECLARE_ATTACKERS && 
                                     allPlayers[1]?.id === activePlayerId && 
                                     !allPlayers[1]?.tappedCreatures.has(`${creature.id}-${index}`) &&
                                     !allPlayers[1]?.combatState?.attackers.includes(`${creature.id}-${index}`)}
                            canBlock={allPlayers[1]?.turnState.currentPhase === Phase.COMBAT && 
                                     allPlayers[1]?.turnState.currentStep === Step.DECLARE_BLOCKERS && 
                                     allPlayers[1]?.id !== activePlayerId && 
                                     !allPlayers[1]?.tappedCreatures.has(`${creature.id}-${index}`)}
                        actions={{
                              tap: () => tapCreature(allPlayers[1]?.id || '', creature, index),
                              untap: () => untapCreature(allPlayers[1]?.id || '', creature, index),
                              discard: () => destroyPermanent(allPlayers[1]?.id || '', creature),
                              exile: () => exilePermanent(allPlayers[1]?.id || '', creature),
                              returnToHand: () => bouncePermanent(allPlayers[1]?.id || '', creature),
                              attack: () => declareAttacker(allPlayers[1]?.id || '', index),
                              block: () => declareBlocker(allPlayers[1]?.id || '', activePlayerId, 0, index)
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

              {/* Vertical Divider - Between Permanents and Command Zone */}
              <div className="col-span-1 row-span-1 row-start-3 col-start-14 flex items-center justify-center">
            <div className="w-1 h-full bg-gradient-to-b from-green-400 via-green-300 to-green-400 rounded-full shadow-lg opacity-60"></div>
          </div>

              {/* Command Zone - Bottom Right (opponent's perspective) */}
              <div className="col-span-2 row-span-1 row-start-3 col-start-15 flex flex-col items-start justify-center">
            <h3 className="text-white text-lg font-bold mb-2 drop-shadow-lg">
                  Command Zone
            </h3>
                {(() => {
                  const commanderCard = allPlayers[1]?.deck ? allPlayers[1].deck.cards.find((card) => card.id.toString() === allPlayers[1].deck?.commander_id) || null : null;
                  return commanderCard ? (
                    <div>
                    <MtgCard
                        card={commanderCard}
                        isCommander={true}
                        context="command"
                      actions={{
                          play: () => castCommander(allPlayers[1]?.id || '', commanderCard)
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
                  );
                })()}
            </div>
          </div>
                  </div>
              </div>
            </div>

      {/* Opponent's Game Header - Above Phase Controls */}
      <div className="mb-4">
        <GameHeader
          deck={allPlayers[1]?.deck}
          turnState={allPlayers[1]?.turnState}
          onShuffleDeck={() => shuffleDeck(allPlayers[1]?.id || '')}
          onResetSimulation={() => resetSimulation(allPlayers[1]?.id || '')}
          onBack={onBack}
          onUpdateMaxHandSize={(newSize) => updateMaxHandSize(allPlayers[1]?.id || '', newSize)}
          onSpendMana={(color) => spendMana(allPlayers[1]?.id || '', color)}
          isActivePlayer={allPlayers[1]?.id === activePlayerId}
        />
      </div>

      {/* Phase Control Bar - Center */}
      <GameControls
        turnState={player.turnState}
        playerName={player.name}
        onPhaseChange={(newPhase) => changePhase(activePlayerId, newPhase)}
        onNextTurn={() => nextTurn(activePlayerId)}
        onAdvanceCombatStep={() => advanceCombatStep(activePlayerId)}
        player1Life={allPlayers[0]?.lifeTotal || 40}
        player2Life={allPlayers[1]?.lifeTotal || 40}
        player1Name={allPlayers[0]?.name || "Player 1"}
        player2Name={allPlayers[1]?.name || "Player 2"}
      />

      {/* Current Player (Player 1) - Bottom */}
      <div className="mt-4">
        <GameHeader
          deck={allPlayers[0]?.deck}
          turnState={allPlayers[0]?.turnState}
          onShuffleDeck={() => shuffleDeck(allPlayers[0]?.id || '')}
          onResetSimulation={() => resetSimulation(allPlayers[0]?.id || '')}
          onBack={onBack}
          onUpdateMaxHandSize={(newSize) => updateMaxHandSize(allPlayers[0]?.id || '', newSize)}
          onSpendMana={(color) => spendMana(allPlayers[0]?.id || '', color)}
          isActivePlayer={allPlayers[0]?.id === activePlayerId}
        />
        <GameBoard
          creatures={allPlayers[0]?.creatures || []}
          lands={allPlayers[0]?.lands || []}
          graveyard={allPlayers[0]?.graveyard || []}
          exile={allPlayers[0]?.exile || []}
          drawnCards={allPlayers[0]?.drawnCards || []}
          commander={allPlayers[0]?.deck ? allPlayers[0].deck.cards.find((card) => card.id.toString() === allPlayers[0].deck?.commander_id) || null : null}
          remainingCards={allPlayers[0] ? allPlayers[0].shuffledDeck.length - allPlayers[0].currentDeckIndex : 0}
          maxHandSize={allPlayers[0]?.turnState.maxHandSize || 7}
          tappedCreatures={allPlayers[0]?.tappedCreatures || new Set()}
          tappedLands={allPlayers[0]?.turnState.tappedLands || []}
          isShuffling={allPlayers[0]?.isShuffling || false}
          showDeckActions={allPlayers[0]?.showDeckActions || false}
          shouldDrawForTurn={allPlayers[0]?.id === activePlayerId && allPlayers[0]?.turnState.currentPhase === Phase.BEGINNING && !allPlayers[0]?.turnState.hasDrawnForTurn}
          isDrawingCard={allPlayers[0]?.isDrawingCard || false}
          drawingCard={allPlayers[0]?.drawingCard || null}
          currentPhase={allPlayers[0]?.turnState.currentPhase || Phase.BEGINNING}
          currentStep={allPlayers[0]?.turnState.currentStep}
          isActivePlayer={allPlayers[0]?.id === activePlayerId}
          combatState={allPlayers[0]?.combatState}
          onDeclareAttacker={(creatureIndex) => declareAttacker(allPlayers[0]?.id || '', creatureIndex)}
          onDeclareBlocker={(blockerIndex) => declareBlocker(allPlayers[0]?.id || '', activePlayerId, 0, blockerIndex)}
          playerId={allPlayers[0]?.id}
          isLand={isLand}
          onTapLand={(land, index) => tapLand(allPlayers[0]?.id || '', land, index)}
          onUntapLand={(land, index) => untapLand(allPlayers[0]?.id || '', land, index)}
          onTapCreature={(creature, index) => tapCreature(allPlayers[0]?.id || '', creature, index)}
          onUntapCreature={(creature, index) => untapCreature(allPlayers[0]?.id || '', creature, index)}
          onDestroyPermanent={(card) => destroyPermanent(allPlayers[0]?.id || '', card)}
          onExilePermanent={(card) => exilePermanent(allPlayers[0]?.id || '', card)}
          onBouncePermanent={(card) => bouncePermanent(allPlayers[0]?.id || '', card)}
          onReturnFromGraveyard={(card) => returnFromGraveyard(allPlayers[0]?.id || '', card)}
          onReturnFromGraveyardToBattlefield={(card) => returnFromGraveyardToBattlefield(allPlayers[0]?.id || '', card)}
          onCastCommander={(card) => castCommander(allPlayers[0]?.id || '', card)}
          onPlayCard={(card) => playCard(allPlayers[0]?.id || '', card)}
          onDiscardCard={(card) => discardCard(allPlayers[0]?.id || '', card)}
          onExileCard={(card) => exileCard(allPlayers[0]?.id || '', card)}
          onDeckClick={() => {
            if (allPlayers[0]?.id === activePlayerId && allPlayers[0]?.turnState.currentPhase === Phase.BEGINNING && !allPlayers[0]?.turnState.hasDrawnForTurn) {
              drawCard(allPlayers[0]?.id || '');
            } else {
              toggleShowDeckActions(allPlayers[0]?.id || '');
            }
          }}
          onDeckHover={() => {}}
          onDeckLeave={() => {}}
          onDrawCard={() => drawCard(allPlayers[0]?.id || '')}
          onScry={(count) => scry(allPlayers[0]?.id || '', count)}
          onSearch={() => toggleSearch(allPlayers[0]?.id || '')}
          onDrawMultiple={(count) => drawMultipleCards(allPlayers[0]?.id || '', count)}
          onShuffleLibrary={() => shuffleDeck(allPlayers[0]?.id || '')}
          onReturnFromExile={(card) => returnFromExile(allPlayers[0]?.id || '', card)}
          onMoveFromExileToGraveyard={(card) => moveFromExileToGraveyard(allPlayers[0]?.id || '', card)}
          onExileFromGraveyard={(card) => exileFromGraveyard(allPlayers[0]?.id || '', card)}
          onShuffleFromGraveyard={(card) => shuffleFromGraveyard(allPlayers[0]?.id || '', card)}
          onShuffleFromExile={(card) => shuffleFromExile(allPlayers[0]?.id || '', card)}
          onReturnFromExileToField={(card) => returnFromExileToField(allPlayers[0]?.id || '', card)}
          onReturnFromGraveyardToField={(card) => returnFromGraveyardToField(allPlayers[0]?.id || '', card)}
        />
                </div>
                
      {/* Scry Decision Modal - Show for any player with scry cards */}
      {(allPlayers[0]?.scryCards.length > 0 || allPlayers[1]?.scryCards.length > 0) && (
        <ScryModal
          scryCards={allPlayers[0]?.scryCards.length > 0 ? allPlayers[0].scryCards : allPlayers[1]?.scryCards || []}
          onDecision={(orderedCards) => {
            const playerWithScry = allPlayers[0]?.scryCards.length > 0 ? allPlayers[0] : allPlayers[1];
            if (playerWithScry) {
              handleScryDecision(playerWithScry.id, orderedCards);
            }
          }}
          onClose={() => {
            const playerWithScry = allPlayers[0]?.scryCards.length > 0 ? allPlayers[0] : allPlayers[1];
            if (playerWithScry) {
              closeScry(playerWithScry.id);
            }
          }}
        />
      )}

      {/* Search Library Modal */}
      {player.isSearching && (
        <SearchModal
          searchResults={player.searchResults}
          onSearch={(searchTerm) => searchLibrary(activePlayerId, searchTerm)}
          onSelectCard={(selectedCard, action) => selectCardFromSearch(activePlayerId, selectedCard, action)}
          onClose={() => closeSearch(activePlayerId)}
        />
      )}


    </div>
  );
};

export default DeckSimulate;