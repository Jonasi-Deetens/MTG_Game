import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Deck, Card, TurnState, SpellEffect, Target, ActivatedAbility } from '../types/deck';
import { Phase, Step, EffectType as EffectTypeEnum } from '../types/deck';
import { api } from '../services/api';
import { enhanceCardsWithEffects } from '../utils/cardEffects';

// Extended interfaces for game state
interface DrawnCard extends Card {
  drawnAt: Date;
}

interface BattlefieldCard extends Card {
  placedAt: Date;
  damage?: number; // Track damage dealt to this creature
  enteredThisTurn?: boolean; // Track summoning sickness
}

interface GraveyardCard extends Card {
  discardedAt: Date;
  damage?: number; // Track damage for destroyed creatures
}

// ExileCard is now just Card (removed exiledAt property)
type ExileCard = Card;

interface ShuffledCard extends Card {
  originalIndex: number;
}

// Stack item type
export interface StackItem {
  id: string; // unique id for stack item
  type: 'spell' | 'ability';
  card: Card;
  controller: string; // playerId
  description?: string;
}

// Player state interface
interface PlayerState {
  id: string;
  name: string;
  deck: Deck | null;
  shuffledDeck: ShuffledCard[];
  currentDeckIndex: number;
  drawnCards: DrawnCard[];
  creatures: BattlefieldCard[];
  lands: BattlefieldCard[];
  graveyard: GraveyardCard[];
  exile: ExileCard[];
  tappedCreatures: Set<string>;
  tappedLands: string[];
  isShuffling: boolean;
  showDeckActions: boolean;
  isDrawingCard: boolean;
  drawingCard: Card | null;
  scryCards: Card[];
  searchResults: ShuffledCard[];
  isSearching: boolean;
  turnState: TurnState;
  commanderTax: number; // Track commander tax
  lifeTotal: number; // Player's life total
  // Combat state
  combatState: {
    isDeclaringAttackers: boolean;
    isDeclaringBlockers: boolean;
    attackers: string[]; // creature instance IDs
    blockers: { [attackerId: string]: string[] }; // attacker -> blockers mapping
  };
  // Targeting system
  targetingState: {
    isTargeting: boolean;
    currentSpell: Card | null;
    requiredTargets: number;
    selectedTargets: string[];
    validTargets: Target[];
    targetType: string | null;
  };
}

// Provider context interface
interface DeckContextType {
  players: PlayerState[];
  activePlayerId: string;
  setActivePlayer: (playerId: string) => void;
  loadDeck: (playerId: string, deckId: number) => Promise<void>;
  drawCard: (playerId: string) => void;
  drawMultipleCards: (playerId: string, count: number) => void;
  playCard: (playerId: string, card: DrawnCard) => void;
  discardCard: (playerId: string, card: DrawnCard) => void;
  exileCard: (playerId: string, card: DrawnCard) => void;
  destroyPermanent: (playerId: string, card: BattlefieldCard) => void;
  exilePermanent: (playerId: string, card: BattlefieldCard) => void;
  bouncePermanent: (playerId: string, card: BattlefieldCard) => void;
  tapLand: (playerId: string, land: Card, index: number) => void;
  untapLand: (playerId: string, land: Card, index: number) => void;
  tapCreature: (playerId: string, creature: BattlefieldCard, index: number) => void;
  untapCreature: (playerId: string, creature: BattlefieldCard, index: number) => void;
  returnFromGraveyard: (playerId: string, card: GraveyardCard) => void;
  returnFromGraveyardToBattlefield: (playerId: string, card: GraveyardCard) => void;
  returnFromGraveyardToField: (playerId: string, card: GraveyardCard) => void;
  returnFromExile: (playerId: string, card: ExileCard) => void;
  moveFromExileToGraveyard: (playerId: string, card: ExileCard) => void;
  exileFromGraveyard: (playerId: string, card: GraveyardCard) => void;
  shuffleFromGraveyard: (playerId: string, card: GraveyardCard) => void;
  shuffleFromExile: (playerId: string, card: ExileCard) => void;
  returnFromExileToField: (playerId: string, card: ExileCard) => void;
  castCommander: (playerId: string, card: Card) => void;
  changePhase: (playerId: string, newPhase: Phase) => void;
  nextTurn: (playerId: string) => void;
  shuffleDeck: (playerId: string) => void;
  scry: (playerId: string, count: number) => void;
  searchLibrary: (playerId: string, searchTerm: string) => void;
  selectCardFromSearch: (playerId: string, selectedCard: ShuffledCard, action: 'toHand' | 'toBattlefield' | 'toTop') => void;
  handleScryDecision: (playerId: string, orderedCards: number[]) => void;
  getPlayer: (playerId: string) => PlayerState | undefined;
  isLand: (card: Card) => boolean;
  isCreature: (card: Card) => boolean;
  isEnchantment: (card: Card) => boolean;
  isArtifact: (card: Card) => boolean;
  isInstant: (card: Card) => boolean;
  isSorcery: (card: Card) => boolean;
  isPermanent: (card: Card) => boolean;
  checkManaCost: (playerId: string, card: Card) => boolean;
  spendManaForCard: (playerId: string, card: Card) => void;
  addPlayer: (playerId: string, name: string) => void;
  removePlayer: (playerId: string) => void;
  toggleShowDeckActions: (playerId: string) => void;
  toggleSearch: (playerId: string) => void;
  closeScry: (playerId: string) => void;
  closeSearch: (playerId: string) => void;
  spendMana: (playerId: string, color: string) => void;
  resetSimulation: (playerId: string) => void;
  updateMaxHandSize: (playerId: string, newSize: number) => void;
  // Turn structure functions
  untapAllPermanents: (playerId: string) => void;
  advanceCombatStep: (playerId: string) => void;
  resolveCombatDamage: (playerId: string) => void;
  clearCombatState: (playerId: string) => void;
  // Combat functions
  declareAttacker: (playerId: string, creatureIndex: number) => void;
  declareBlocker: (defenderPlayerId: string, attackerPlayerId: string, attackerIndex: number, blockerIndex: number) => void;
  resolveCombat: (attackingPlayerId: string, defendingPlayerId: string) => void;
  // Stack functions
  stack: StackItem[];
  addToStack: (item: StackItem) => void;
  passPriority: () => void;
  resolveTopOfStack: () => void;
  resolveSpellEffect: (effect: SpellEffect, controller: string) => void;
  // Targeting functions
  startTargeting: (card: Card, targetType: string, requiredTargets: number) => void;
  selectTarget: (targetId: string) => void;
  cancelTargeting: () => void;
  confirmTargeting: () => void;
  getValidTargets: (targetType: string, controller: string) => Target[];
  addExampleCardToHand: (playerId: string, card: Card) => void;
  // Damage system functions
  getCreatureToughness: (creature: BattlefieldCard) => number;
  getCreaturePower: (creature: BattlefieldCard) => number;
  dealDamageToCreature: (playerId: string, creature: BattlefieldCard, damage: number) => void;
  clearDamageFromCreatures: (playerId: string) => void;
  // Activated abilities functions
  canActivateAbility: (playerId: string, card: Card, ability: ActivatedAbility) => boolean;
  activateAbility: (playerId: string, card: Card, ability: ActivatedAbility) => void;
  getActivatableAbilities: (playerId: string, card: Card) => ActivatedAbility[];
}

// Create context
const DeckContext = createContext<DeckContextType | undefined>(undefined);

// Provider component
interface DeckProviderProps {
  children: ReactNode;
}

export const DeckProvider: React.FC<DeckProviderProps> = ({ children }) => {
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [activePlayerId, setActivePlayerId] = useState<string>('');
  const [stack, setStack] = useState<StackItem[]>([]);

  // Initialize default players
  useEffect(() => {
    const defaultPlayers: PlayerState[] = [
      {
        id: 'player1',
        name: 'Player 1',
        deck: null,
        shuffledDeck: [],
        currentDeckIndex: 0,
        drawnCards: [],
        creatures: [],
        lands: [],
        graveyard: [],
        exile: [],
        tappedCreatures: new Set(),
        tappedLands: [],
        isShuffling: false,
        showDeckActions: false,
        isDrawingCard: false,
        drawingCard: null,
        scryCards: [],
        searchResults: [],
        isSearching: false,
        turnState: {
          turnNumber: 1,
          currentPhase: Phase.BEGINNING,
          currentStep: Step.UNTAP,
          isActivePlayer: true,
          hasDrawnForTurn: false,
          hasPlayedLand: false,
          maxHandSize: 7,
          manaPool: {
            white: 0,
            blue: 0,
            black: 0,
            red: 0,
            green: 0,
            colorless: 0
          },
          landsTapped: false,
          tappedLands: [],
          manaSources: {},
          landManaUsed: [],
          hasUntappedThisTurn: false,
          hasResolvedUpkeep: false,
          hasResolvedEndStep: false
        },
        commanderTax: 0,
        lifeTotal: 40, // Starting life total (Commander format)
        combatState: {
          isDeclaringAttackers: false,
          isDeclaringBlockers: false,
          attackers: [],
          blockers: {}
        },
        targetingState: {
          isTargeting: false,
          currentSpell: null,
          requiredTargets: 0,
          selectedTargets: [],
          validTargets: [],
          targetType: null
        }
      },
      {
        id: 'player2',
        name: 'Player 2',
        deck: null,
        shuffledDeck: [],
        currentDeckIndex: 0,
        drawnCards: [],
        creatures: [],
        lands: [],
        graveyard: [],
        exile: [],
        tappedCreatures: new Set(),
        tappedLands: [],
        isShuffling: false,
        showDeckActions: false,
        isDrawingCard: false,
        drawingCard: null,
        scryCards: [],
        searchResults: [],
        isSearching: false,
        turnState: {
          turnNumber: 1,
          currentPhase: Phase.BEGINNING,
          currentStep: Step.UNTAP,
          isActivePlayer: false,
          hasDrawnForTurn: false,
          hasPlayedLand: false,
          maxHandSize: 7,
          manaPool: {
            white: 0,
            blue: 0,
            black: 0,
            red: 0,
            green: 0,
            colorless: 0
          },
          landsTapped: false,
          tappedLands: [],
          manaSources: {},
          landManaUsed: [],
          hasUntappedThisTurn: false,
          hasResolvedUpkeep: false,
          hasResolvedEndStep: false
        },
        commanderTax: 0,
        lifeTotal: 40, // Starting life total (Commander format)
        combatState: {
          isDeclaringAttackers: false,
          isDeclaringBlockers: false,
          attackers: [],
          blockers: {}
        },
        targetingState: {
          isTargeting: false,
          currentSpell: null,
          requiredTargets: 0,
          selectedTargets: [],
          validTargets: [],
          targetType: null
        }
      }
    ];
    
    setPlayers(defaultPlayers);
    setActivePlayerId('player1');
  }, []);

  // Helper functions
  const getPlayer = (playerId: string): PlayerState | undefined => {
    return players.find(p => p.id === playerId);
  };

  const updatePlayer = (playerId: string, updates: Partial<PlayerState>) => {
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, ...updates } : p));
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const isLand = (card: Card): boolean => {
    return card.type?.toLowerCase().includes("land") || false;
  };

  const isCreature = (card: Card): boolean => {
    return card.type?.toLowerCase().includes("creature") || false;
  };

  const isEnchantment = (card: Card): boolean => {
    return card.type?.toLowerCase().includes("enchantment") || false;
  };

  const isArtifact = (card: Card): boolean => {
    return card.type?.toLowerCase().includes("artifact") || false;
  };

  const isInstant = (card: Card): boolean => {
    return card.type?.toLowerCase().includes("instant") || false;
  };

  const isSorcery = (card: Card): boolean => {
    return card.type?.toLowerCase().includes("sorcery") || false;
  };

  const isPermanent = (card: Card): boolean => {
    return isLand(card) || isCreature(card) || isEnchantment(card) || isArtifact(card);
  };

  // Keyword checking functions
  const hasKeyword = (card: Card, keyword: string): boolean => {
    return card.keywords?.some(k => k.toLowerCase() === keyword.toLowerCase()) || 
           card.text?.toLowerCase().includes(keyword.toLowerCase()) || false;
  };

  const hasFlying = (card: Card): boolean => {
    return hasKeyword(card, 'flying');
  };

  const hasReach = (card: Card): boolean => {
    return hasKeyword(card, 'reach');
  };

  const hasVigilance = (card: Card): boolean => {
    return hasKeyword(card, 'vigilance');
  };

  const hasHaste = (card: Card): boolean => {
    return hasKeyword(card, 'haste');
  };

  const hasTrample = (card: Card): boolean => {
    return hasKeyword(card, 'trample');
  };

  const hasLifelink = (card: Card): boolean => {
    return hasKeyword(card, 'lifelink');
  };

  const hasDeathtouch = (card: Card): boolean => {
    return hasKeyword(card, 'deathtouch');
  };

  const hasFirstStrike = (card: Card): boolean => {
    return hasKeyword(card, 'first_strike') || hasKeyword(card, 'first strike');
  };

  const hasDoubleStrike = (card: Card): boolean => {
    return hasKeyword(card, 'double_strike') || hasKeyword(card, 'double strike');
  };

  // Summoning sickness check
  const hasSummoningSickness = (creature: BattlefieldCard): boolean => {
    // Creatures with haste can attack immediately
    if (hasHaste(creature)) return false;
    
    // Check if creature entered this turn
    return creature.enteredThisTurn === true;
  };

  // Helper function to get creature toughness as a number
  const getCreatureToughness = (creature: BattlefieldCard): number => {
    return parseInt(creature.toughness || '0') || 0;
  };

  // Helper function to get creature power as a number
  const getCreaturePower = (creature: BattlefieldCard): number => {
    return parseInt(creature.power || '0') || 0;
  };

  // Helper function to deal damage to a creature
  const dealDamageToCreature = (playerId: string, creature: BattlefieldCard, damage: number, source?: BattlefieldCard) => {
    const player = getPlayer(playerId);
    if (!player) return;

    const currentDamage = creature.damage || 0;
    const newDamage = currentDamage + damage;
    const toughness = getCreatureToughness(creature);

    console.log(`Dealing ${damage} damage to ${creature.name}: ${currentDamage} -> ${newDamage}/${toughness}`);

    // Check for deathtouch - any damage from a deathtouch source is lethal
    const isDeathtouch = source && hasDeathtouch(source) && damage > 0;
    const isLethal = newDamage >= toughness || isDeathtouch;

    // Check if creature should be destroyed
    if (isLethal) {
      // Check for indestructible keyword
      const isIndestructible = creature.keywords?.includes('indestructible');
      if (!isIndestructible) {
        // Remove creature from battlefield and add to graveyard
        const updatedCreatures = player.creatures.filter(c => 
          c.id !== creature.id || c.placedAt.getTime() !== creature.placedAt.getTime()
        );
        const graveyardCard: GraveyardCard = {
          ...creature,
          damage: 0, // Reset damage when destroyed
          discardedAt: new Date(),
        };
        
        updatePlayer(playerId, {
          creatures: updatedCreatures,
          graveyard: [...player.graveyard, graveyardCard]
        });
        
        const deathMessage = isDeathtouch ? ` (deathtouch)` : ` (${newDamage}/${toughness})`;
        alert(`${creature.name} takes ${damage} damage and is destroyed!${deathMessage}`);
      } else {
        // Update damage but don't destroy
        const updatedCreatures = player.creatures.map(c => 
          c.id === creature.id && c.placedAt.getTime() === creature.placedAt.getTime() 
            ? { ...c, damage: newDamage } 
            : c
        );
        
        updatePlayer(playerId, {
          creatures: updatedCreatures
        });
        
        alert(`${creature.name} takes ${damage} damage but is indestructible! (${newDamage}/${toughness})`);
      }
    } else {
      // Update the creature's damage
      const updatedCreatures = player.creatures.map(c => 
        c.id === creature.id && c.placedAt.getTime() === creature.placedAt.getTime()
          ? { ...c, damage: newDamage } 
          : c
      );

      updatePlayer(playerId, {
        creatures: updatedCreatures
      });
      
      alert(`${creature.name} takes ${damage} damage! (${newDamage}/${toughness})`);
    }
  };

  // Helper function to clear damage from all creatures at end of turn
  const clearDamageFromCreatures = (playerId: string) => {
    const player = getPlayer(playerId);
    if (!player) return;

    const updatedCreatures = player.creatures.map(creature => ({
      ...creature,
      damage: 0
    }));

    updatePlayer(playerId, {
      creatures: updatedCreatures
    });
  };

  const checkManaCost = (playerId: string, card: Card): boolean => {
    const player = getPlayer(playerId);
    if (!player) return false;

    const cmc = card.cmc || 0;
    const totalMana = Object.values(player.turnState.manaPool).reduce((sum, amount) => sum + amount, 0);
    
    return totalMana >= cmc;
  };

  const spendManaForCard = (playerId: string, card: Card) => {
    const player = getPlayer(playerId);
    if (!player) return;

    const cmc = card.cmc || 0;
    let remainingCost = cmc;
    
    const manaToSpend = { ...player.turnState.manaPool };
    const manaSourcesToUpdate = { ...player.turnState.manaSources };
    const landsUsed: string[] = [];
    
    // Spend colorless mana first, then colored mana
    const colorlessToSpend = Math.min(manaToSpend.colorless, remainingCost);
    manaToSpend.colorless -= colorlessToSpend;
    remainingCost -= colorlessToSpend;
    
    // Mark colorless mana sources as used
    if (colorlessToSpend > 0) {
      const colorlessSources = Object.values(manaSourcesToUpdate)
        .filter(source => source.manaType === 'colorless' && source.available)
        .slice(0, colorlessToSpend);
      
      colorlessSources.forEach(source => {
        manaSourcesToUpdate[source.landId].available = false;
        landsUsed.push(source.landId);
      });
    }
    
    // Spend colored mana if needed
    if (remainingCost > 0) {
      const coloredMana = ['white', 'blue', 'black', 'red', 'green'] as const;
      for (const color of coloredMana) {
        if (remainingCost <= 0) break;
        const toSpend = Math.min(manaToSpend[color], remainingCost);
        manaToSpend[color] -= toSpend;
        remainingCost -= toSpend;
        
        // Mark colored mana sources as used
        if (toSpend > 0) {
          const colorSources = Object.values(manaSourcesToUpdate)
            .filter(source => source.manaType === color && source.available)
            .slice(0, toSpend);
          
          colorSources.forEach(source => {
            manaSourcesToUpdate[source.landId].available = false;
            landsUsed.push(source.landId);
          });
        }
      }
    }
    
    updatePlayer(playerId, {
      turnState: {
        ...player.turnState,
        manaPool: manaToSpend,
        manaSources: manaSourcesToUpdate,
        landManaUsed: [...player.turnState.landManaUsed, ...landsUsed]
      }
    });
  };

  // Deck loading and initialization
  const loadDeck = async (playerId: string, deckId: number) => {
    try {
      const fetchedDeck = await api.getDeck(deckId);
      const player = getPlayer(playerId);
      if (!player) return;

      // Enhance all cards with their MTG effects, keywords, and abilities
      const enhancedCards = enhanceCardsWithEffects(fetchedDeck.cards);
      console.log(`Enhanced ${enhancedCards.length} cards with effects`);
      
      // Update the deck with enhanced cards
      const enhancedDeck = { ...fetchedDeck, cards: enhancedCards };

      // Initialize shuffled deck
      const allCards: ShuffledCard[] = [];
      let index = 0;

      enhancedDeck.cards.forEach((card) => {
        if (card.id.toString() !== enhancedDeck.commander_id) {
          const quantity = card.quantity || 1;
          for (let i = 0; i < quantity; i++) {
            allCards.push({
              ...card,
              originalIndex: index++,
            });
          }
        }
      });

      const shuffled = shuffleArray([...allCards]);
      
      // Draw initial 7-card hand
      const initialHand: DrawnCard[] = [];
      for (let i = 0; i < 7; i++) {
        if (i < shuffled.length) {
          const card = shuffled[i];
          initialHand.push({
            ...card,
            drawnAt: new Date(),
          });
        }
      }

      updatePlayer(playerId, {
        deck: enhancedDeck,
        shuffledDeck: shuffled,
        currentDeckIndex: 7,
        drawnCards: initialHand
      });
    } catch (err) {
      console.error('Failed to load deck:', err);
    }
  };

  // Card drawing functions
  const drawCard = (playerId: string) => {
    const player = getPlayer(playerId);
    if (!player || player.currentDeckIndex >= player.shuffledDeck.length) {
      console.log(`Cannot draw card: player ${playerId} not found or no cards left`);
      return;
    }

    const cardToDraw = player.shuffledDeck[player.currentDeckIndex];
    console.log(`Drawing card: ${cardToDraw.name} for player ${player.name}`);
    
    // Start drawing animation
    updatePlayer(playerId, {
      drawingCard: cardToDraw,
      isDrawingCard: true
    });

    // Animate the card drawing
    setTimeout(() => {
      const drawnCard: DrawnCard = {
        ...cardToDraw,
        drawnAt: new Date(),
      };
      
      updatePlayer(playerId, {
        drawnCards: [...player.drawnCards, drawnCard],
        currentDeckIndex: player.currentDeckIndex + 1,
        isDrawingCard: false,
        drawingCard: null
      });
      
      console.log(`Card drawn: ${cardToDraw.name}, new hand size: ${player.drawnCards.length + 1}`);
      
      // Mark as drawn for turn if in beginning phase
      if (player.turnState.currentPhase === Phase.BEGINNING && !player.turnState.hasDrawnForTurn) {
        updatePlayer(playerId, {
          turnState: {
            ...player.turnState,
            hasDrawnForTurn: true
          }
        });
      }
    }, 800);
  };

  const drawMultipleCards = (playerId: string, count: number) => {
    const player = getPlayer(playerId);
    if (!player || player.currentDeckIndex + count > player.shuffledDeck.length) return;
    
    const cardsToDraw = player.shuffledDeck.slice(player.currentDeckIndex, player.currentDeckIndex + count);
    let currentCardIndex = 0;
    
    const animateNextCard = () => {
      if (currentCardIndex < cardsToDraw.length) {
        const card = cardsToDraw[currentCardIndex];
        updatePlayer(playerId, {
          drawingCard: card,
          isDrawingCard: true
        });
        
        setTimeout(() => {
          updatePlayer(playerId, {
            isDrawingCard: false,
            drawingCard: null
          });
          currentCardIndex++;
          
          setTimeout(() => {
            animateNextCard();
          }, 100);
        }, 800);
      } else {
        const newDrawnCards: DrawnCard[] = cardsToDraw.map(card => ({
          ...card,
          drawnAt: new Date(),
        }));
        
        updatePlayer(playerId, {
          drawnCards: [...newDrawnCards, ...player.drawnCards],
          currentDeckIndex: player.currentDeckIndex + count,
          showDeckActions: false
        });
      }
    };
    
    animateNextCard();
  };

  // Card playing functions
  const playCard = (playerId: string, card: DrawnCard) => {
    const player = getPlayer(playerId);
    if (!player) return;

    // Lands are special actions that don't use the stack
    if (isLand(card)) {
      // Check if a land has already been played this turn
      if (player.turnState.hasPlayedLand) {
        alert("You can only play one land per turn!");
        return;
      }

      // Check if it's the player's turn (lands can only be played on your turn)
      if (playerId !== activePlayerId) {
        alert("You can only play lands on your turn.");
        return;
      }

      // Lands go directly to the battlefield
      const battlefieldCard: BattlefieldCard = {
        ...card,
        placedAt: new Date(),
      };
      
      updatePlayer(playerId, {
        drawnCards: player.drawnCards.filter(c => c.id !== card.id),
        lands: [...player.lands, battlefieldCard],
        turnState: {
          ...player.turnState,
          hasPlayedLand: true
        }
      });
      return;
    }

    // For spells, check if it's the player's turn or if they can play instants
    const isInstant = card.type?.toLowerCase().includes('instant');
    const isSorcery = card.type?.toLowerCase().includes('sorcery');
    
    // Can only play sorceries on your turn, during main phase, with empty stack
    if (isSorcery && (playerId !== activePlayerId || stack.length > 0)) {
      alert("Sorceries can only be played during your main phase with an empty stack.");
      return;
    }

    // Check if player has priority (for now, only active player has priority)
    if (playerId !== activePlayerId && !isInstant) {
      alert("You don't have priority to play this card.");
      return;
    }

    // Check if the spell requires targeting
    if (card.effects && card.effects.some(effect => effect.requiresTarget)) {
      const targetingEffect = card.effects.find(effect => effect.requiresTarget);
      if (targetingEffect && targetingEffect.targetType) {
        console.log(`Starting targeting for ${card.name} with target type: ${targetingEffect.targetType}`);
        startTargeting(card, targetingEffect.targetType, 1);
        return; // Don't add to stack yet, wait for targeting
      }
    }

    // Add spells to the stack
    const stackItem: StackItem = {
      id: `${card.id}-${Date.now()}`,
      type: 'spell',
      card: card,
      controller: playerId,
      description: `Casting ${card.name}`
    };

    addToStack(stackItem);

    // Remove card from hand (find the card by ID and remove the first occurrence)
    const cardIndex = player.drawnCards.findIndex(c => c.id === card.id);
    if (cardIndex !== -1) {
      const updatedDrawnCards = [...player.drawnCards];
      updatedDrawnCards.splice(cardIndex, 1);
      updatePlayer(playerId, {
        drawnCards: updatedDrawnCards
      });
    }
  };

  const discardCard = (playerId: string, card: DrawnCard) => {
    const player = getPlayer(playerId);
    if (!player) return;

    const graveyardCard: GraveyardCard = {
      ...card,
      discardedAt: new Date(),
    };
    
    updatePlayer(playerId, {
      drawnCards: player.drawnCards.filter(c => c !== card),
      graveyard: [...player.graveyard, graveyardCard]
    });
  };

  const exileCard = (playerId: string, card: DrawnCard) => {
    const player = getPlayer(playerId);
    if (!player) return;

    const exileCard: ExileCard = {
      ...card,
      // Removed exiledAt property to fix type conflicts
    };
    
    updatePlayer(playerId, {
      drawnCards: player.drawnCards.filter(c => c !== card),
      exile: [...player.exile, exileCard]
    });
  };

  // Permanent management functions
  const destroyPermanent = (playerId: string, card: BattlefieldCard) => {
    const player = getPlayer(playerId);
    if (!player) return;

    console.log(`Destroying permanent: ${card.name} (ID: ${card.id})`);

    // Find the card by ID and placement time to ensure we get the correct instance
    const creatureIndex = player.creatures.findIndex(c => 
      c.id === card.id && c.placedAt.getTime() === card.placedAt.getTime()
    );
    const landIndex = player.lands.findIndex(l => 
      l.id === card.id && l.placedAt.getTime() === card.placedAt.getTime()
    );
    
    const isCreature = creatureIndex !== -1;
    const isLand = landIndex !== -1;
    
    console.log(`Card found - Creature: ${isCreature}, Land: ${isLand}, Creature Index: ${creatureIndex}, Land Index: ${landIndex}`);
    
    let tappedCreaturesUpdate = player.tappedCreatures;
    let tappedLandsUpdate = player.turnState.tappedLands;
    let manaSourcesUpdate = player.turnState.manaSources;
    let manaPoolUpdate = player.turnState.manaPool;
    
    if (isCreature) {
      // Remove from tapped creatures
      const creatureInstanceId = `${card.id}-${creatureIndex}`;
      tappedCreaturesUpdate = new Set([...player.tappedCreatures].filter(id => id !== creatureInstanceId));
      console.log(`Removed creature instance ${creatureInstanceId} from tapped creatures`);
    } else if (isLand) {
      // Remove from tapped lands and mana sources
      const landInstanceId = `${card.id}-${landIndex}`;
      tappedLandsUpdate = player.turnState.tappedLands.filter(id => id !== landInstanceId);
      manaSourcesUpdate = Object.fromEntries(
        Object.entries(player.turnState.manaSources).filter(([key]) => key !== landInstanceId)
      );
      
      // Remove mana that was generated from this land
      const landManaSource = player.turnState.manaSources[landInstanceId];
      if (landManaSource && landManaSource.available) {
        const manaType = landManaSource.manaType;
        const currentMana = player.turnState.manaPool[manaType];
        if (currentMana > 0) {
          manaPoolUpdate = {
            ...player.turnState.manaPool,
            [manaType]: Math.max(0, currentMana - 1)
          };
        }
      }
      console.log(`Removed land instance ${landInstanceId} from tapped lands`);
    }

    // Remove the card from the appropriate array using the found index
    const updatedCreatures = [...player.creatures];
    const updatedLands = [...player.lands];
    
    if (isCreature) {
      updatedCreatures.splice(creatureIndex, 1);
      console.log(`Removed creature at index ${creatureIndex}, remaining creatures: ${updatedCreatures.length}`);
    } else if (isLand) {
      updatedLands.splice(landIndex, 1);
      console.log(`Removed land at index ${landIndex}, remaining lands: ${updatedLands.length}`);
    }

    updatePlayer(playerId, {
      creatures: updatedCreatures,
      lands: updatedLands,
      tappedCreatures: tappedCreaturesUpdate,
      turnState: {
        ...player.turnState,
        tappedLands: tappedLandsUpdate,
        manaSources: manaSourcesUpdate,
        manaPool: manaPoolUpdate
      }
    });
    
    // Check if this is the commander - if so, it goes back to command zone
    if (card.id.toString() === player.deck?.commander_id) {
      console.log(`${card.name} (commander) was destroyed and returned to command zone`);
      updatePlayer(playerId, { 
        commanderTax: (player.commanderTax || 0) + 1 
      });
    } else {
      // Regular permanent goes to graveyard
      const graveyardCard: GraveyardCard = {
        ...card,
        discardedAt: new Date(),
        damage: card.damage || 0 // Preserve damage for destroyed creatures
      };
      updatePlayer(playerId, {
        graveyard: [...player.graveyard, graveyardCard]
      });
      console.log(`${card.name} added to graveyard. Graveyard size: ${player.graveyard.length + 1}`);
    }
  };

  const exilePermanent = (playerId: string, card: BattlefieldCard) => {
    const player = getPlayer(playerId);
    if (!player) return;

    // Clean up tapped arrays for this card
    const cardIndex = player.creatures.findIndex(c => c === card);
    const isCreature = cardIndex !== -1;
    const isLand = player.lands.includes(card);
    
    let tappedCreaturesUpdate = player.tappedCreatures;
    let tappedLandsUpdate = player.turnState.tappedLands;
    let manaSourcesUpdate = player.turnState.manaSources;
    let manaPoolUpdate = player.turnState.manaPool;
    
    if (isCreature) {
      // Remove from tapped creatures
      const creatureInstanceId = `${card.id}-${cardIndex}`;
      tappedCreaturesUpdate = new Set([...player.tappedCreatures].filter(id => id !== creatureInstanceId));
    } else if (isLand) {
      // Remove from tapped lands and mana sources
      const landIndex = player.lands.findIndex(c => c === card);
      const landInstanceId = `${card.id}-${landIndex}`;
      tappedLandsUpdate = player.turnState.tappedLands.filter(id => id !== landInstanceId);
      manaSourcesUpdate = Object.fromEntries(
        Object.entries(player.turnState.manaSources).filter(([key]) => key !== landInstanceId)
      );
      
      // Remove mana that was generated from this land
      const landManaSource = player.turnState.manaSources[landInstanceId];
      if (landManaSource && landManaSource.available) {
        const manaType = landManaSource.manaType;
        const currentMana = player.turnState.manaPool[manaType];
        if (currentMana > 0) {
          manaPoolUpdate = {
            ...player.turnState.manaPool,
            [manaType]: Math.max(0, currentMana - 1)
          };
        }
      }
    }

    updatePlayer(playerId, {
      creatures: player.creatures.filter(c => c !== card),
      lands: player.lands.filter(c => c !== card),
      tappedCreatures: tappedCreaturesUpdate,
      turnState: {
        ...player.turnState,
        tappedLands: tappedLandsUpdate,
        manaSources: manaSourcesUpdate,
        manaPool: manaPoolUpdate
      }
    });
    
    // Check if this is the commander - if so, it goes back to command zone
    if (card.id.toString() === player.deck?.commander_id) {
      console.log(`${card.name} (commander) was exiled and returned to command zone`);
      updatePlayer(playerId, { 
        commanderTax: (player.commanderTax || 0) + 1 
      });
    } else {
      // Regular permanent goes to exile
      const exileCard: ExileCard = {
        ...card,
      };
      updatePlayer(playerId, {
        exile: [...player.exile, exileCard]
      });
    }
  };

  const bouncePermanent = (playerId: string, card: BattlefieldCard) => {
    const player = getPlayer(playerId);
    if (!player) return;

    // Clean up tapped arrays for this card
    const cardIndex = player.creatures.findIndex(c => c === card);
    const isCreature = cardIndex !== -1;
    const isLand = player.lands.includes(card);
    
    let tappedCreaturesUpdate = player.tappedCreatures;
    let tappedLandsUpdate = player.turnState.tappedLands;
    let manaSourcesUpdate = player.turnState.manaSources;
    let manaPoolUpdate = player.turnState.manaPool;
    
    if (isCreature) {
      // Remove from tapped creatures
      const creatureInstanceId = `${card.id}-${cardIndex}`;
      tappedCreaturesUpdate = new Set([...player.tappedCreatures].filter(id => id !== creatureInstanceId));
    } else if (isLand) {
      // Remove from tapped lands and mana sources
      const landIndex = player.lands.findIndex(c => c === card);
      const landInstanceId = `${card.id}-${landIndex}`;
      tappedLandsUpdate = player.turnState.tappedLands.filter(id => id !== landInstanceId);
      manaSourcesUpdate = Object.fromEntries(
        Object.entries(player.turnState.manaSources).filter(([key]) => key !== landInstanceId)
      );
      
      // Remove mana that was generated from this land
      const landManaSource = player.turnState.manaSources[landInstanceId];
      if (landManaSource && landManaSource.available) {
        const manaType = landManaSource.manaType;
        const currentMana = player.turnState.manaPool[manaType];
        if (currentMana > 0) {
          manaPoolUpdate = {
            ...player.turnState.manaPool,
            [manaType]: Math.max(0, currentMana - 1)
          };
        }
      }
    }

    updatePlayer(playerId, {
      creatures: player.creatures.filter(c => c !== card),
      lands: player.lands.filter(c => c !== card),
      tappedCreatures: tappedCreaturesUpdate,
      turnState: {
        ...player.turnState,
        tappedLands: tappedLandsUpdate,
        manaSources: manaSourcesUpdate,
        manaPool: manaPoolUpdate
      }
    });
    
    // Check if this is the commander - if so, it goes back to command zone
    if (card.id.toString() === player.deck?.commander_id) {
      console.log(`${card.name} (commander) was bounced and returned to command zone`);
      updatePlayer(playerId, { 
        commanderTax: (player.commanderTax || 0) + 1 
      });
    } else {
      // Regular permanent goes to hand
      const handCard: DrawnCard = {
        ...card,
        drawnAt: new Date(),
      };
      updatePlayer(playerId, {
        drawnCards: [handCard, ...player.drawnCards]
      });
    }
  };

  // Land and creature tap/untap functions
  const tapLand = (playerId: string, land: Card, index: number) => {
    const player = getPlayer(playerId);
    if (!player || !land.id) return;
    
    const landName = land.name.toLowerCase();
    let manaType: 'white' | 'blue' | 'black' | 'red' | 'green' | 'colorless' = 'colorless';
    
    if (landName.includes('plains')) manaType = 'white';
    else if (landName.includes('island')) manaType = 'blue';
    else if (landName.includes('swamp')) manaType = 'black';
    else if (landName.includes('mountain')) manaType = 'red';
    else if (landName.includes('forest')) manaType = 'green';
    
    const landInstanceId = `${land.id}-${index}`;
    
    updatePlayer(playerId, {
      turnState: {
        ...player.turnState,
        manaPool: {
          ...player.turnState.manaPool,
          [manaType]: player.turnState.manaPool[manaType] + 1
        },
        tappedLands: [...player.turnState.tappedLands, landInstanceId],
        manaSources: {
          ...player.turnState.manaSources,
          [landInstanceId]: {
            landId: landInstanceId,
            manaType: manaType,
            available: true
          }
        }
      }
    });
  };

  const untapLand = (playerId: string, land: Card, index: number) => {
    const player = getPlayer(playerId);
    if (!player || !land.id) return;
    
    const landInstanceId = `${land.id}-${index}`;
    
    if (player.turnState.landManaUsed.includes(landInstanceId)) {
      return; // Cannot untap if mana has been used
    }
    
    const landManaSource = player.turnState.manaSources[landInstanceId];
    if (!landManaSource) return;
    
    updatePlayer(playerId, {
      turnState: {
        ...player.turnState,
        manaPool: {
          ...player.turnState.manaPool,
          [landManaSource.manaType]: Math.max(0, player.turnState.manaPool[landManaSource.manaType] - 1)
        },
        tappedLands: player.turnState.tappedLands.filter(id => id !== landInstanceId),
        manaSources: Object.fromEntries(
          Object.entries(player.turnState.manaSources).filter(([key]) => key !== landInstanceId)
        )
      }
    });
  };

  const tapCreature = (playerId: string, creature: BattlefieldCard, index: number) => {
    const player = getPlayer(playerId);
    if (!player) return;
    
    const creatureInstanceId = `${creature.id}-${index}`;
    updatePlayer(playerId, {
      tappedCreatures: new Set([...player.tappedCreatures, creatureInstanceId])
    });
  };

  const untapCreature = (playerId: string, creature: BattlefieldCard, index: number) => {
    const player = getPlayer(playerId);
    if (!player) return;
    
    const creatureInstanceId = `${creature.id}-${index}`;
    updatePlayer(playerId, {
      tappedCreatures: new Set([...player.tappedCreatures].filter(id => id !== creatureInstanceId))
    });
  };

  // Graveyard and exile functions
  const returnFromGraveyard = (playerId: string, card: GraveyardCard) => {
    const player = getPlayer(playerId);
    if (!player) return;

    const handCard: DrawnCard = {
      ...card,
      drawnAt: new Date(),
    };
    
    updatePlayer(playerId, {
      graveyard: player.graveyard.filter(c => c !== card),
      drawnCards: [handCard, ...player.drawnCards]
    });
  };

  const returnFromGraveyardToBattlefield = (playerId: string, card: GraveyardCard) => {
    const player = getPlayer(playerId);
    if (!player) return;

    const battlefieldCard: BattlefieldCard = {
      ...card,
      placedAt: new Date(),
    };
    
    updatePlayer(playerId, {
      graveyard: player.graveyard.filter(c => c !== card),
      creatures: [...player.creatures, battlefieldCard]
    });
  };

  const returnFromGraveyardToField = (playerId: string, card: GraveyardCard) => {
    const player = getPlayer(playerId);
    if (!player) return;

    const battlefieldCard: BattlefieldCard = {
      ...card,
      placedAt: new Date(),
    };
    
    updatePlayer(playerId, {
      graveyard: player.graveyard.filter(c => c !== card)
    });

    if (isLand(card)) {
      updatePlayer(playerId, {
        lands: [...player.lands, battlefieldCard]
      });
    } else {
      updatePlayer(playerId, {
        creatures: [...player.creatures, battlefieldCard]
      });
    }
  };

  const returnFromExile = (playerId: string, card: ExileCard) => {
    const player = getPlayer(playerId);
    if (!player) return;

    const drawnCard: DrawnCard = {
      ...card,
      drawnAt: new Date(),
    };
    
    updatePlayer(playerId, {
      exile: player.exile.filter(c => c !== card),
      drawnCards: [...player.drawnCards, drawnCard]
    });
  };

  const moveFromExileToGraveyard = (playerId: string, card: ExileCard) => {
    const player = getPlayer(playerId);
    if (!player) return;

    const graveyardCard: GraveyardCard = {
      ...card,
      discardedAt: new Date(),
    };
    
    updatePlayer(playerId, {
      exile: player.exile.filter(c => c !== card),
      graveyard: [...player.graveyard, graveyardCard]
    });
  };

  const exileFromGraveyard = (playerId: string, card: GraveyardCard) => {
    const player = getPlayer(playerId);
    if (!player) return;

    updatePlayer(playerId, {
      graveyard: player.graveyard.filter(c => c !== card),
      exile: [...player.exile, card]
    });
  };

  const shuffleFromGraveyard = (playerId: string, card: GraveyardCard) => {
    const player = getPlayer(playerId);
    if (!player) return;

    const shuffledCard: ShuffledCard = {
      ...card,
      originalIndex: player.shuffledDeck.length,
    };
    
    updatePlayer(playerId, {
      graveyard: player.graveyard.filter(c => c !== card),
      shuffledDeck: [...player.shuffledDeck, shuffledCard]
    });
  };

  const shuffleFromExile = (playerId: string, card: ExileCard) => {
    const player = getPlayer(playerId);
    if (!player) return;

    const shuffledCard: ShuffledCard = {
      ...card,
      originalIndex: player.shuffledDeck.length,
    };
    
    const remainingCards = player.shuffledDeck.slice(player.currentDeckIndex);
    const randomIndex = Math.floor(Math.random() * (remainingCards.length + 1));
    remainingCards.splice(randomIndex, 0, shuffledCard);
    
    updatePlayer(playerId, {
      exile: player.exile.filter(c => c !== card),
      shuffledDeck: [
        ...player.shuffledDeck.slice(0, player.currentDeckIndex),
        ...remainingCards
      ]
    });
  };

  const returnFromExileToField = (playerId: string, card: ExileCard) => {
    const player = getPlayer(playerId);
    if (!player) return;

    const battlefieldCard: BattlefieldCard = {
      ...card,
      placedAt: new Date(),
    };
    
    updatePlayer(playerId, {
      exile: player.exile.filter(c => c !== card)
    });

    if (isLand(card)) {
      updatePlayer(playerId, {
        lands: [...player.lands, battlefieldCard]
      });
    } else {
      updatePlayer(playerId, {
        creatures: [...player.creatures, battlefieldCard]
      });
    }
  };

  // Commander functions
  const castCommander = (playerId: string, card: Card) => {
    const player = getPlayer(playerId);
    if (!player) return;

    // Calculate commander tax (2 generic mana per time cast from command zone)
    const commanderTax = player.commanderTax * 2;
    const totalCost = (card.cmc || 0) + commanderTax;
    
    // Check if player has enough total mana
    const totalMana = Object.values(player.turnState.manaPool).reduce((sum, amount) => sum + amount, 0);
    if (totalMana < totalCost) {
      alert(`Not enough mana to cast ${card.name}. Cost: ${card.cmc || 0} + Commander tax: ${commanderTax} = ${totalCost} total mana`);
      return;
    }

    // Spend mana for the commander (including commander tax)
    const manaToSpend = { ...player.turnState.manaPool };
    const manaSourcesToUpdate = { ...player.turnState.manaSources };
    const landsUsed: string[] = [];
    let remainingCost = totalCost;
    
    // Spend colorless mana first, then colored mana
    const colorlessToSpend = Math.min(manaToSpend.colorless, remainingCost);
    manaToSpend.colorless -= colorlessToSpend;
    remainingCost -= colorlessToSpend;
    
    // Mark colorless mana sources as used
    if (colorlessToSpend > 0) {
      const colorlessSources = Object.values(manaSourcesToUpdate)
        .filter(source => source.manaType === 'colorless' && source.available)
        .slice(0, colorlessToSpend);
      
      colorlessSources.forEach(source => {
        manaSourcesToUpdate[source.landId].available = false;
        landsUsed.push(source.landId);
      });
    }
    
    // Spend colored mana if needed
    if (remainingCost > 0) {
      const coloredMana = ['white', 'blue', 'black', 'red', 'green'] as const;
      for (const color of coloredMana) {
        if (remainingCost <= 0) break;
        const toSpend = Math.min(manaToSpend[color], remainingCost);
        manaToSpend[color] -= toSpend;
        remainingCost -= toSpend;
        
        // Mark colored mana sources as used
        if (toSpend > 0) {
          const colorSources = Object.values(manaSourcesToUpdate)
            .filter(source => source.manaType === color && source.available)
            .slice(0, toSpend);
          
          colorSources.forEach(source => {
            manaSourcesToUpdate[source.landId].available = false;
            landsUsed.push(source.landId);
          });
        }
      }
    }
    
    // Update mana pool and sources
    updatePlayer(playerId, {
      turnState: {
        ...player.turnState,
        manaPool: manaToSpend,
        manaSources: manaSourcesToUpdate,
        landManaUsed: [...player.turnState.landManaUsed, ...landsUsed]
      },
      commanderTax: player.commanderTax + 1
    });

    const battlefieldCard: BattlefieldCard = {
      ...card,
      placedAt: new Date(),
    };
    
    if (isLand(card)) {
      updatePlayer(playerId, {
        lands: [...player.lands, battlefieldCard]
      });
    } else {
      updatePlayer(playerId, {
        creatures: [...player.creatures, battlefieldCard]
      });
    }
  };

  // Turn and phase management
  const changePhase = (playerId: string, newPhase: Phase) => {
    const player = getPlayer(playerId);
    if (!player) return;

    // Set the appropriate step for the new phase
    let newStep: Step;
    switch (newPhase) {
      case Phase.BEGINNING:
        newStep = Step.UNTAP;
        break;
      case Phase.COMBAT:
        newStep = Step.BEGINNING_OF_COMBAT;
        break;
      case Phase.ENDING:
        newStep = Step.END_STEP;
        break;
      default:
        newStep = player.turnState.currentStep; // Keep current step for main phases
    }

    updatePlayer(playerId, {
      turnState: {
        ...player.turnState,
        currentPhase: newPhase,
        currentStep: newStep
      },
      showDeckActions: newPhase === Phase.BEGINNING ? player.showDeckActions : false
    });
  };

  const advanceCombatStep = (playerId: string) => {
    const player = getPlayer(playerId);
    if (!player || player.turnState.currentPhase !== Phase.COMBAT) return;

    let nextStep: Step;
    switch (player.turnState.currentStep) {
      case Step.BEGINNING_OF_COMBAT:
        nextStep = Step.DECLARE_ATTACKERS;
        break;
      case Step.DECLARE_ATTACKERS:
        // If no attackers were declared, skip to end of combat
        if (player.combatState.attackers.length === 0) {
          nextStep = Step.END_OF_COMBAT;
        } else {
          nextStep = Step.DECLARE_BLOCKERS;
        }
        break;
      case Step.DECLARE_BLOCKERS: {
        // Check if any creatures have first strike
        const hasFirstStrike = checkForFirstStrike(playerId);
        if (hasFirstStrike) {
          nextStep = Step.FIRST_STRIKE_DAMAGE;
        } else {
          nextStep = Step.COMBAT_DAMAGE;
        }
        break;
      }
      case Step.FIRST_STRIKE_DAMAGE:
        // Resolve first strike damage
        resolveCombatDamage(playerId, true);
        nextStep = Step.COMBAT_DAMAGE;
        break;
      case Step.COMBAT_DAMAGE:
        // Resolve regular combat damage
        resolveCombatDamage(playerId, false);
        nextStep = Step.END_OF_COMBAT;
        break;
      case Step.END_OF_COMBAT:
        // Clear combat state and move to postcombat main phase
        clearCombatState(playerId);
        changePhase(playerId, Phase.POSTCOMBAT_MAIN);
        return;
      default:
        return;
    }

    updatePlayer(playerId, {
      turnState: {
        ...player.turnState,
        currentStep: nextStep
      }
    });
  };

  const checkForFirstStrike = (playerId: string): boolean => {
    const player = getPlayer(playerId);
    if (!player) return false;

    // Check if any attacking creatures have first strike
    const hasAttackingFirstStrike = player.combatState.attackers.some(attackerInstanceId => {
      const parts = attackerInstanceId.split('-');
      const attackerIndexStr = parts[parts.length - 1];
      const attackerIndex = parseInt(attackerIndexStr);
      const attackingCreature = player.creatures[attackerIndex];
      return attackingCreature && hasFirstStrikeAbility(attackingCreature);
    });

    // Check if any blocking creatures have first strike
    const defendingPlayer = players.find(p => p.id !== playerId);
    if (!defendingPlayer) return hasAttackingFirstStrike;

    const hasBlockingFirstStrike = Object.values(defendingPlayer.combatState.blockers).some(blockers => 
      blockers.some(blockerInstanceId => {
        const parts = blockerInstanceId.split('-');
        const blockerIndexStr = parts[parts.length - 1];
        const blockerIndex = parseInt(blockerIndexStr);
        const blockingCreature = defendingPlayer.creatures[blockerIndex];
        return blockingCreature && hasFirstStrikeAbility(blockingCreature);
      })
    );

    return hasAttackingFirstStrike || hasBlockingFirstStrike;
  };

  const hasFirstStrikeAbility = (creature: Card): boolean => {
    // Check if creature has first strike ability
    // This is a simplified check - in a real implementation you'd parse the card text
    return creature.text?.toLowerCase().includes('first strike') || false;
  };

  const resolveCombatDamage = (playerId: string, isFirstStrike: boolean = false) => {
    const player = getPlayer(playerId);
    if (!player) return;

    // Find the defending player (the other player)
    const defendingPlayer = players.find(p => p.id !== playerId);
    if (!defendingPlayer) return;

    const combatResults: string[] = [];
    const damageType = isFirstStrike ? "First Strike" : "Regular";

    // Helper to check double strike
    const hasDoubleStrikeAbility = (creature: Card): boolean => {
      return creature.text?.toLowerCase().includes('double strike') || false;
    };

    // Process each attacking creature
    player.combatState.attackers.forEach(attackerInstanceId => {
      const parts = attackerInstanceId.split('-');
      const attackerIndexStr = parts[parts.length - 1];
      const attackerIndex = parseInt(attackerIndexStr);
      const attackingCreature = player.creatures[attackerIndex];
      if (!attackingCreature) return;

      const isFirstStrikeAttacker = hasFirstStrikeAbility(attackingCreature) || hasDoubleStrikeAbility(attackingCreature);
      // Only process this attacker in the correct step
      if ((isFirstStrike && !isFirstStrikeAttacker) || (!isFirstStrike && isFirstStrikeAttacker && !hasDoubleStrikeAbility(attackingCreature))) {
        return;
      }

      const blockers = defendingPlayer.combatState.blockers[attackerInstanceId] || [];
      if (blockers.length === 0) {
        // Direct attack - deal damage to player
        const damage = parseInt(attackingCreature.power || '0');
        combatResults.push(`${attackingCreature.name} deals ${damage} damage to ${defendingPlayer.name}`);
        // Reduce the defender's life total
        const newLifeTotal = Math.max(0, defendingPlayer.lifeTotal - damage);
        updatePlayer(defendingPlayer.id, {
          lifeTotal: newLifeTotal
        });
        
        // Handle lifelink for direct attacks
        if (hasLifelink(attackingCreature) && damage > 0) {
          const newAttackerLifeTotal = player.lifeTotal + damage;
          updatePlayer(playerId, {
            lifeTotal: newAttackerLifeTotal
          });
          combatResults.push(`${attackingCreature.name} (lifelink): ${player.name} gains ${damage} life`);
        }
        
        if (newLifeTotal === 0) {
          combatResults.push(`💀 ${defendingPlayer.name} has been defeated!`);
        }
      } else {
        // Combat with blockers
        blockers.forEach(blockerInstanceId => {
          const parts = blockerInstanceId.split('-');
          const blockerIndexStr = parts[parts.length - 1];
          const blockerIndex = parseInt(blockerIndexStr);
          const blockingCreature = defendingPlayer.creatures[blockerIndex];
          if (!blockingCreature) return;
          const isFirstStrikeBlocker = hasFirstStrikeAbility(blockingCreature) || hasDoubleStrikeAbility(blockingCreature);
          // Only process this blocker in the correct step
          if ((isFirstStrike && !isFirstStrikeBlocker) || (!isFirstStrike && isFirstStrikeBlocker && !hasDoubleStrikeAbility(blockingCreature))) {
            return;
          }
          const attackerPower = getCreaturePower(attackingCreature);
          const blockerPower = getCreaturePower(blockingCreature);
          // Deal damage using the new damage system
          combatResults.push(`${attackingCreature.name} (${attackerPower}) fights ${blockingCreature.name} (${blockerPower}) [${damageType}]`);
          
          // Deal damage to blocker
          dealDamageToCreature(defendingPlayer.id, blockingCreature, attackerPower, attackingCreature);
          
          // Deal damage to attacker  
          dealDamageToCreature(playerId, attackingCreature, blockerPower, blockingCreature);
          
          // Handle lifelink
          if (hasLifelink(attackingCreature) && attackerPower > 0) {
            const newLifeTotal = player.lifeTotal + attackerPower;
            updatePlayer(playerId, {
              lifeTotal: newLifeTotal
            });
            combatResults.push(`${attackingCreature.name} (lifelink): ${player.name} gains ${attackerPower} life`);
          }
          
          if (hasLifelink(blockingCreature) && blockerPower > 0) {
            const newLifeTotal = defendingPlayer.lifeTotal + blockerPower;
            updatePlayer(defendingPlayer.id, {
              lifeTotal: newLifeTotal
            });
            combatResults.push(`${blockingCreature.name} (lifelink): ${defendingPlayer.name} gains ${blockerPower} life`);
          }
        });
      }
    });

    // Show combat results
    if (combatResults.length > 0) {
      alert(`${damageType} Combat Results:\n\n${combatResults.join('\n')}`);
    }

    // Tap attacking creatures (only after regular damage step)
    if (!isFirstStrike) {
      player.combatState.attackers.forEach(attackerInstanceId => {
        const parts = attackerInstanceId.split('-');
        const attackerIndexStr = parts[parts.length - 1];
        const attackerIndex = parseInt(attackerIndexStr);
        const attackingCreature = player.creatures[attackerIndex];
        if (attackingCreature) {
          tapCreature(playerId, attackingCreature, attackerIndex);
        }
      });
    }
  };

  const clearCombatState = (playerId: string) => {
    const player = getPlayer(playerId);
    if (!player) return;

    // Clear damage from all creatures after combat
    const updatedCreatures = player.creatures.map(creature => ({
      ...creature,
      damage: 0
    }));

    updatePlayer(playerId, {
      creatures: updatedCreatures,
      combatState: {
        isDeclaringAttackers: false,
        isDeclaringBlockers: false,
        attackers: [],
        blockers: {}
      }
    });
  };

  // Untap all permanents for a player
  const untapAllPermanents = (playerId: string) => {
    const player = getPlayer(playerId);
    if (!player) return;

    // Clear all tapped creatures
    const untappedCreatures = new Set<string>();
    
    // Clear all tapped lands
    const untappedLands: string[] = [];
    
    // Clear mana sources since they're no longer tapped
    const clearedManaSources: { [landId: string]: {
      landId: string;
      manaType: 'white' | 'blue' | 'black' | 'red' | 'green' | 'colorless';
      available: boolean;
    } } = {};

    updatePlayer(playerId, {
      tappedCreatures: untappedCreatures,
      turnState: {
        ...player.turnState,
        tappedLands: untappedLands,
        manaSources: clearedManaSources,
        hasUntappedThisTurn: true
      }
    });
  };

  const nextTurn = (playerId: string) => {
    const player = getPlayer(playerId);
    if (!player) return;

    // Check hand size before allowing turn transition
    if (player.drawnCards.length > player.turnState.maxHandSize) {
      const excessCards = player.drawnCards.length - player.turnState.maxHandSize;
      alert(`You have ${player.drawnCards.length} cards in hand but maximum hand size is ${player.turnState.maxHandSize}. You must discard ${excessCards} card(s) before proceeding to the next turn.`);
      return;
    }

    // Find the next player to switch to
    const currentPlayerIndex = players.findIndex(p => p.id === playerId);
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    const nextPlayerId = players[nextPlayerIndex].id;

    // Clear damage from all players' creatures at end of turn (including when combat is skipped)
    players.forEach(p => {
      clearDamageFromCreatures(p.id);
    });
    
    // Update current player's turn state (end their turn)
    updatePlayer(playerId, {
      turnState: {
        ...player.turnState,
        isActivePlayer: false
      }
    });

    // Update next player's turn state (start their turn)
    const nextPlayer = getPlayer(nextPlayerId);
    if (nextPlayer) {
      // Automatically untap all permanents for the new active player
      untapAllPermanents(nextPlayerId);
      
      // Clear summoning sickness from all creatures
      const updatedCreatures = nextPlayer.creatures.map(creature => ({
        ...creature,
        enteredThisTurn: false
      }));
      
      updatePlayer(nextPlayerId, {
        creatures: updatedCreatures,
        turnState: {
          turnNumber: nextPlayer.turnState.turnNumber + 1,
          currentPhase: Phase.BEGINNING,
          currentStep: Step.UNTAP,
          isActivePlayer: true,
          hasDrawnForTurn: false,
          hasPlayedLand: false,
          maxHandSize: nextPlayer.turnState.maxHandSize,
          manaPool: {
            white: 0,
            blue: 0,
            black: 0,
            red: 0,
            green: 0,
            colorless: 0
          },
          landsTapped: false,
          tappedLands: [],
          manaSources: {},
          landManaUsed: [],
          hasUntappedThisTurn: true, // Already untapped
          hasResolvedUpkeep: false,
          hasResolvedEndStep: false
        },
        tappedCreatures: new Set()
      });
    }

    // Switch active player
    setActivePlayerId(nextPlayerId);
  };

  // Deck manipulation functions
  const shuffleDeck = (playerId: string) => {
    const player = getPlayer(playerId);
    if (!player) return;

    updatePlayer(playerId, { isShuffling: true });

    setTimeout(() => {
      const remainingCards = player.shuffledDeck.slice(player.currentDeckIndex);
      const shuffled = shuffleArray([...remainingCards]);

      const newShuffledDeck = [
        ...player.shuffledDeck.slice(0, player.currentDeckIndex),
        ...shuffled,
      ];

      updatePlayer(playerId, {
        shuffledDeck: newShuffledDeck,
        isShuffling: false
      });
    }, 800);
  };

  const scry = (playerId: string, count: number) => {
    const player = getPlayer(playerId);
    if (!player) return;

    const scryCards = player.shuffledDeck.slice(player.currentDeckIndex, player.currentDeckIndex + count);
    updatePlayer(playerId, { scryCards });
  };

  const searchLibrary = (playerId: string, searchTerm: string) => {
    const player = getPlayer(playerId);
    if (!player) return;

    const searchResults = player.shuffledDeck
      .slice(player.currentDeckIndex)
      .filter(card => 
        card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.type?.toLowerCase().includes(searchTerm.toLowerCase())
      );

    updatePlayer(playerId, {
      searchResults,
      isSearching: true
    });
  };

  const selectCardFromSearch = (playerId: string, selectedCard: ShuffledCard, action: 'toHand' | 'toBattlefield' | 'toTop') => {
    const player = getPlayer(playerId);
    if (!player) return;

    if (action === 'toHand') {
      const drawnCard: DrawnCard = {
        ...selectedCard,
        drawnAt: new Date(),
      };
      
      updatePlayer(playerId, {
        drawnCards: [drawnCard, ...player.drawnCards],
        searchResults: [],
        isSearching: false
      });
    } else if (action === 'toBattlefield') {
      const battlefieldCard: BattlefieldCard = {
        ...selectedCard,
        placedAt: new Date(),
      };
      
      if (isLand(selectedCard)) {
        updatePlayer(playerId, {
          lands: [...player.lands, battlefieldCard],
          searchResults: [],
          isSearching: false
        });
      } else {
        updatePlayer(playerId, {
          creatures: [...player.creatures, battlefieldCard],
          searchResults: [],
          isSearching: false
        });
      }
    } else if (action === 'toTop') {
      const newDeck = [...player.shuffledDeck];
      const cardIndex = newDeck.findIndex(card => 
        card.id === selectedCard.id && 
        newDeck.indexOf(card) >= player.currentDeckIndex
      );
      
      if (cardIndex !== -1) {
        const [card] = newDeck.splice(cardIndex, 1);
        newDeck.splice(player.currentDeckIndex, 0, card);
      }
      
      updatePlayer(playerId, {
        shuffledDeck: newDeck,
        searchResults: [],
        isSearching: false
      });
    }
  };

  const handleScryDecision = (playerId: string, orderedCards: number[]) => {
    const player = getPlayer(playerId);
    if (!player) return;

    const scryCards = [...player.scryCards];
    const newDeck = [...player.shuffledDeck];
    const startIndex = player.currentDeckIndex;
    const scryCount = scryCards.length;
    
    // Remove the scry cards from their current positions
    newDeck.splice(startIndex, scryCount);
    
    if (orderedCards.length === 0) {
      // Put all cards on bottom - add them at the end of the deck
      scryCards.forEach((card, i) => {
        const shuffledCard: ShuffledCard = {
          ...card,
          originalIndex: newDeck.length + i
        };
        newDeck.push(shuffledCard);
      });
    } else {
      // Add the reordered cards at the top (convert back to ShuffledCard)
      const reorderedCards = orderedCards.map(index => scryCards[index]);
      reorderedCards.forEach((card, i) => {
        const shuffledCard: ShuffledCard = {
          ...card,
          originalIndex: startIndex + i
        };
        newDeck.splice(startIndex + i, 0, shuffledCard);
      });
      
      // Put the remaining unselected cards at the bottom
      const selectedIndices = new Set(orderedCards);
      const unselectedCards = scryCards.filter((_, index) => !selectedIndices.has(index));
      unselectedCards.forEach((card, i) => {
        const shuffledCard: ShuffledCard = {
          ...card,
          originalIndex: newDeck.length + i
        };
        newDeck.push(shuffledCard);
      });
    }
    
    updatePlayer(playerId, {
      shuffledDeck: newDeck,
      scryCards: []
    });
  };

  // Player management functions
  const addPlayer = (playerId: string, name: string) => {
    const newPlayer: PlayerState = {
      id: playerId,
      name,
      deck: null,
      shuffledDeck: [],
      currentDeckIndex: 0,
      drawnCards: [],
      creatures: [],
      lands: [],
      graveyard: [],
      exile: [],
      tappedCreatures: new Set(),
      tappedLands: [],
      isShuffling: false,
      showDeckActions: false,
      isDrawingCard: false,
      drawingCard: null,
      scryCards: [],
      searchResults: [],
      isSearching: false,
      turnState: {
        turnNumber: 1,
        currentPhase: Phase.BEGINNING,
        currentStep: Step.UNTAP,
        isActivePlayer: false,
        hasDrawnForTurn: false,
        hasPlayedLand: false,
        maxHandSize: 7,
        manaPool: {
          white: 0,
          blue: 0,
          black: 0,
          red: 0,
          green: 0,
          colorless: 0
        },
        landsTapped: false,
        tappedLands: [],
        manaSources: {},
        landManaUsed: [],
        hasUntappedThisTurn: false,
        hasResolvedUpkeep: false,
        hasResolvedEndStep: false
      },
      commanderTax: 0,
      lifeTotal: 40, // Starting life total (Commander format)
      combatState: {
        isDeclaringAttackers: false,
        isDeclaringBlockers: false,
        attackers: [],
        blockers: {}
      },
      targetingState: {
        isTargeting: false,
        currentSpell: null,
        requiredTargets: 0,
        selectedTargets: [],
        validTargets: [],
        targetType: null
      }
    };
    
    setPlayers(prev => [...prev, newPlayer]);
  };

  const removePlayer = (playerId: string) => {
    setPlayers(prev => prev.filter(p => p.id !== playerId));
    if (activePlayerId === playerId) {
      setActivePlayerId(players[0]?.id || '');
    }
  };

  const setActivePlayer = (playerId: string) => {
    setActivePlayerId(playerId);
  };

  // Additional utility functions
  const toggleShowDeckActions = (playerId: string) => {
    const player = getPlayer(playerId);
    if (!player) return;
    
    updatePlayer(playerId, {
      showDeckActions: !player.showDeckActions
    });
  };

  const toggleSearch = (playerId: string) => {
    const player = getPlayer(playerId);
    if (!player) return;
    
    updatePlayer(playerId, {
      isSearching: !player.isSearching,
      searchResults: player.isSearching ? [] : player.searchResults
    });
  };

  const closeScry = (playerId: string) => {
    updatePlayer(playerId, {
      scryCards: []
    });
  };

  const closeSearch = (playerId: string) => {
    updatePlayer(playerId, {
      isSearching: false,
      searchResults: []
    });
  };

  const spendMana = (playerId: string, color: string) => {
    const player = getPlayer(playerId);
    if (!player) return;

    updatePlayer(playerId, {
      turnState: {
        ...player.turnState,
        manaPool: {
          ...player.turnState.manaPool,
          [color]: Math.max(0, player.turnState.manaPool[color as keyof typeof player.turnState.manaPool] - 1)
        }
      }
    });
  };

  const resetSimulation = (playerId: string) => {
    const player = getPlayer(playerId);
    if (!player || !player.deck) return;

    // Reinitialize the deck
    const allCards: ShuffledCard[] = [];
    let index = 0;

    player.deck.cards.forEach((card) => {
      if (card.id.toString() !== player.deck?.commander_id) {
        const quantity = card.quantity || 1;
        for (let i = 0; i < quantity; i++) {
          allCards.push({
            ...card,
            originalIndex: index++,
          });
        }
      }
    });

    const shuffled = shuffleArray([...allCards]);
    
    // Draw initial 7-card hand
    const initialHand: DrawnCard[] = [];
    for (let i = 0; i < 7; i++) {
      if (i < shuffled.length) {
        const card = shuffled[i];
        initialHand.push({
          ...card,
          drawnAt: new Date(),
        });
      }
    }

    updatePlayer(playerId, {
      shuffledDeck: shuffled,
      currentDeckIndex: 7,
      drawnCards: initialHand,
      creatures: [],
      lands: [],
      graveyard: [],
      exile: [],
      tappedCreatures: new Set(),
      tappedLands: [],
      isShuffling: false,
      showDeckActions: false,
      isDrawingCard: false,
      drawingCard: null,
      scryCards: [],
      searchResults: [],
      isSearching: false,
      commanderTax: 0,
      turnState: {
        turnNumber: 1,
        currentPhase: Phase.BEGINNING,
        currentStep: Step.UNTAP,
        isActivePlayer: true,
        hasDrawnForTurn: false,
        hasPlayedLand: false,
        maxHandSize: 7,
        manaPool: {
          white: 0,
          blue: 0,
          black: 0,
          red: 0,
          green: 0,
          colorless: 0
        },
        landsTapped: false,
        tappedLands: [],
        manaSources: {},
        landManaUsed: [],
        hasUntappedThisTurn: false,
        hasResolvedUpkeep: false,
        hasResolvedEndStep: false
      }
    });
  };

  const updateMaxHandSize = (playerId: string, newSize: number) => {
    const player = getPlayer(playerId);
    if (!player) return;

    updatePlayer(playerId, {
      turnState: {
        ...player.turnState,
        maxHandSize: newSize
      }
    });
  };

  // Combat functions
  const declareAttacker = (playerId: string, creatureIndex: number) => {
    const player = getPlayer(playerId);
    if (!player || player.turnState.currentPhase !== Phase.COMBAT || player.turnState.currentStep !== Step.DECLARE_ATTACKERS) {
      return;
    }
    
    // Only the active player can declare attackers
    if (playerId !== activePlayerId) {
      alert("Only the active player can declare attackers!");
      return;
    }

    const creature = player.creatures[creatureIndex];
    if (!creature || !isCreature(creature)) {
      return;
    }

    // Check if creature is tapped
    const creatureInstanceId = `${creature.id}-${creatureIndex}`;
    if (player.tappedCreatures.has(creatureInstanceId)) {
      alert("Tapped creatures cannot attack!");
      return;
    }

    // Check for summoning sickness
    if (hasSummoningSickness(creature)) {
      alert(`${creature.name} has summoning sickness and cannot attack!`);
      return;
    }

    // Check if creature is already attacking
    if (player.combatState.attackers.includes(creatureInstanceId)) {
      // Remove from attackers (and untap if vigilance was applied)
      const newAttackers = player.combatState.attackers.filter(id => id !== creatureInstanceId);
      updatePlayer(playerId, {
        combatState: {
          ...player.combatState,
          attackers: newAttackers
        }
      });
      
      // If creature has vigilance, it should still be untapped
      if (hasVigilance(creature)) {
        updatePlayer(playerId, {
          tappedCreatures: new Set([...player.tappedCreatures].filter(id => id !== creatureInstanceId))
        });
      }
    } else {
      // Add to attackers
      const newAttackers = [...player.combatState.attackers, creatureInstanceId];
      updatePlayer(playerId, {
        combatState: {
          ...player.combatState,
          attackers: newAttackers
        }
      });
      
      // Tap the attacking creature (unless it has vigilance)
      if (!hasVigilance(creature)) {
        updatePlayer(playerId, {
          tappedCreatures: new Set([...player.tappedCreatures, creatureInstanceId])
        });
      }
    }
  };

  const declareBlocker = (defenderPlayerId: string, attackerPlayerId: string, attackerIndex: number, blockerIndex: number) => {
    const defender = getPlayer(defenderPlayerId);
    const attacker = getPlayer(attackerPlayerId);
    if (!defender || !attacker) {
      return;
    }
    
    // Check if we're in the declare blockers step
    const activePlayer = getPlayer(activePlayerId);
    if (!activePlayer || activePlayer.turnState.currentPhase !== Phase.COMBAT || activePlayer.turnState.currentStep !== Step.DECLARE_BLOCKERS) {
      return;
    }

    const blocker = defender.creatures[blockerIndex];
    if (!blocker || !isCreature(blocker)) return;

    // Check if blocker is tapped
    const blockerInstanceId = `${blocker.id}-${blockerIndex}`;
    if (defender.tappedCreatures.has(blockerInstanceId)) {
      alert("Tapped creatures cannot block!");
      return;
    }

    // Only allow blocking if there are actual attackers
    if (attacker.combatState.attackers.length === 0) {
      alert("No attackers declared - cannot block!");
      return;
    }

    // For now, block the first attacker
    const firstAttackerId = attacker.combatState.attackers[0];
    
    // Check if this attacker is already being blocked by this blocker
    const currentBlockers = defender.combatState.blockers[firstAttackerId] || [];
    if (currentBlockers.includes(blockerInstanceId)) {
      // Remove blocker
      const updatedBlockers = currentBlockers.filter(id => id !== blockerInstanceId);
      updatePlayer(defenderPlayerId, {
        combatState: {
          ...defender.combatState,
          blockers: {
            ...defender.combatState.blockers,
            [firstAttackerId]: updatedBlockers
          }
        }
      });
    } else {
      // Add blocker
      updatePlayer(defenderPlayerId, {
        combatState: {
          ...defender.combatState,
          blockers: {
            ...defender.combatState.blockers,
            [firstAttackerId]: [...currentBlockers, blockerInstanceId]
          }
        }
      });
    }
  };

  const resolveCombat = (attackingPlayerId: string, defendingPlayerId: string) => {
    const attacker = getPlayer(attackingPlayerId);
    const defender = getPlayer(defendingPlayerId);
    if (!attacker || !defender) return;

    const combatResults: string[] = [];

    // Process each attacking creature
    attacker.combatState.attackers.forEach(attackerInstanceId => {
      const parts = attackerInstanceId.split('-');
      const attackerIndexStr = parts[parts.length - 1]; // Get the last part
      const attackerIndex = parseInt(attackerIndexStr);
      const attackingCreature = attacker.creatures[attackerIndex];
      
      if (!attackingCreature) {
        return;
      }

      const blockers = defender.combatState.blockers[attackerInstanceId] || [];
      
      if (blockers.length === 0) {
        // Direct attack - deal damage to player
        const damage = parseInt(attackingCreature.power || '0');
        combatResults.push(`${attackingCreature.name} deals ${damage} damage to ${defender.name}`);
        
        // Actually reduce the defender's life total
        const newLifeTotal = Math.max(0, defender.lifeTotal - damage);
        updatePlayer(defendingPlayerId, {
          lifeTotal: newLifeTotal
        });
        
        if (newLifeTotal === 0) {
          combatResults.push(`💀 ${defender.name} has been defeated!`);
        }
      } else {
        // Combat with blockers
        blockers.forEach(blockerInstanceId => {
          const parts = blockerInstanceId.split('-');
          const blockerIndexStr = parts[parts.length - 1];
          const blockerIndex = parseInt(blockerIndexStr);
          const blockingCreature = defender.creatures[blockerIndex];
          
          if (!blockingCreature) {
            return;
          }

          const attackerPower = parseInt(attackingCreature.power || '0');
          const attackerToughness = parseInt(attackingCreature.toughness || '0');
          const blockerPower = parseInt(blockingCreature.power || '0');
          const blockerToughness = parseInt(blockingCreature.toughness || '0');

          // Deal damage
          combatResults.push(`${attackingCreature.name} (${attackerPower}/${attackerToughness}) fights ${blockingCreature.name} (${blockerPower}/${blockerToughness})`);

          // Check for creature death
          if (attackerPower >= blockerToughness) {
            combatResults.push(`💀 ${blockingCreature.name} is destroyed`);
            destroyPermanent(defendingPlayerId, blockingCreature);
          }
          if (blockerPower >= attackerToughness) {
            combatResults.push(`💀 ${attackingCreature.name} is destroyed`);
            destroyPermanent(attackingPlayerId, attackingCreature);
          }
        });
      }
    });

    // Show combat results
    if (combatResults.length > 0) {
      alert(`Combat Results:\n\n${combatResults.join('\n')}`);
    } else if (attacker.combatState.attackers.length === 0 && Object.keys(defender.combatState.blockers).length === 0) {
      alert("No combat occurred - no attackers or blockers were declared.");
    } else if (attacker.combatState.attackers.length === 0) {
      alert("No combat occurred - blockers were declared but no attackers were declared.");
    } else {
      alert("No combat occurred - attackers were declared but no combat damage was dealt.");
    }

    // Clear combat state
    updatePlayer(attackingPlayerId, {
      combatState: {
        isDeclaringAttackers: false,
        isDeclaringBlockers: false,
        attackers: [],
        blockers: {}
      }
    });
    updatePlayer(defendingPlayerId, {
      combatState: {
        isDeclaringAttackers: false,
        isDeclaringBlockers: false,
        attackers: [],
        blockers: {}
      }
    });

    // Tap attacking creatures
    attacker.combatState.attackers.forEach(attackerInstanceId => {
      const parts = attackerInstanceId.split('-');
      const attackerIndexStr = parts[parts.length - 1];
      const attackerIndex = parseInt(attackerIndexStr);
      const attackingCreature = attacker.creatures[attackerIndex];
      
      if (attackingCreature) {
        tapCreature(attackingPlayerId, attackingCreature, attackerIndex);
      }
    });

    // Move to next phase after combat
    changePhase(activePlayerId, Phase.POSTCOMBAT_MAIN);
  };

  const addToStack = (item: StackItem) => {
    setStack(prev => [...prev, item]);
  };

  const passPriority = () => {
    // If last player to pass was the other player, resolve top of stack
    if (stack.length > 0) {
      resolveTopOfStack();
    }
  };

  const resolveTopOfStack = () => {
    setStack(prev => {
      if (prev.length === 0) return prev;
      const top = prev[prev.length - 1];
      
      // Resolve the spell/ability
      const player = getPlayer(top.controller);
      if (!player) return prev.slice(0, -1);

      const card = top.card;
      
      // Resolve spell effects if the card has them
      if (card.effects && card.effects.length > 0) {
        console.log(`Resolving ${card.effects.length} effects for ${card.name}`);
        card.effects.forEach((effect, index) => {
          console.log(`Resolving effect ${index + 1}:`, effect);
          resolveSpellEffect(effect, top.controller);
        });
      }
      
      if (isPermanent(card)) {
        // Permanents (creatures, artifacts, enchantments) go to the battlefield
        const battlefieldCard: BattlefieldCard = {
          ...card,
          placedAt: new Date(),
          enteredThisTurn: true, // Mark for summoning sickness
        };
        
        if (isCreature(card)) {
          updatePlayer(top.controller, {
            creatures: [...player.creatures, battlefieldCard]
          });
        } else if (isArtifact(card) || isEnchantment(card)) {
          // For now, artifacts and enchantments go to creatures zone
          updatePlayer(top.controller, {
            creatures: [...player.creatures, battlefieldCard]
          });
        }
      } else {
        // Non-permanents (instants, sorceries) go to graveyard after being cast
        const graveyardCard: GraveyardCard = {
          ...card,
          discardedAt: new Date(),
        };
        updatePlayer(top.controller, {
          graveyard: [...player.graveyard, graveyardCard]
        });
      }
      
      // Don't show a separate alert - the effects will show their own alerts
      return prev.slice(0, -1);
    });
  };

  // Spell effects resolution system
  const resolveSpellEffect = (effect: SpellEffect, controller: string) => {
    const controllerPlayer = getPlayer(controller);
    
    if (!controllerPlayer) return;

    switch (effect.type) {
      case EffectTypeEnum.DAMAGE:
        if (effect.value && effect.targets && effect.targets.length > 0) {
          effect.targets.forEach(targetId => {
            // Check if target is a player
            const targetPlayer = getPlayer(targetId);
            if (targetPlayer) {
              const newLifeTotal = Math.max(0, targetPlayer.lifeTotal - effect.value!);
              updatePlayer(targetId, {
                lifeTotal: newLifeTotal
              });
              alert(`${effect.description}: ${targetPlayer.name} takes ${effect.value} damage!`);
            } else {
              // Check if target is a creature from ANY player
              let targetFound = false;
              for (const player of players) {
                // Check creatures
                const targetCreature = player.creatures.find(c => `${c.id}-${c.placedAt.getTime()}` === targetId);
                if (targetCreature) {
                  // Use the new damage system
                  dealDamageToCreature(player.id, targetCreature, effect.value!);
                  targetFound = true;
                  break;
                }
                
                // Check lands (lands don't have toughness, so destroy them)
                const targetLand = player.lands.find(l => `${l.id}-${l.placedAt.getTime()}` === targetId);
                if (targetLand) {
                  destroyPermanent(player.id, targetLand);
                  alert(`${effect.description}: ${targetLand.name} takes ${effect.value} damage and is destroyed!`);
                  targetFound = true;
                  break;
                }
              }
              
              if (!targetFound) {
                console.warn(`Target not found: ${targetId}`);
              }
            }
          });
        }
        break;

      case EffectTypeEnum.DRAW:
        if (effect.value) {
          console.log(`Drawing ${effect.value} cards for ${controllerPlayer.name}`);
          console.log(`Effect details:`, effect);
          // Use drawMultipleCards instead of multiple drawCard calls to avoid state issues
          drawMultipleCards(controller, effect.value);
          alert(`${effect.description}: ${controllerPlayer.name} draws ${effect.value} card(s)!`);
        }
        break;

      case EffectTypeEnum.DESTROY:
        if (effect.targets && effect.targets.length > 0) {
          effect.targets.forEach(targetId => {
            // Find the target in ANY player's creatures or lands
            let targetFound = false;
            for (const player of players) {
              // Check creatures
              const targetCreature = player.creatures.find(c => `${c.id}-${c.placedAt.getTime()}` === targetId);
              if (targetCreature) {
                destroyPermanent(player.id, targetCreature);
                alert(`${effect.description}: ${targetCreature.name} is destroyed!`);
                targetFound = true;
                break;
              }
              
              // Check lands
              const targetLand = player.lands.find(l => `${l.id}-${l.placedAt.getTime()}` === targetId);
              if (targetLand) {
                destroyPermanent(player.id, targetLand);
                alert(`${effect.description}: ${targetLand.name} is destroyed!`);
                targetFound = true;
                break;
              }
            }
            
            if (!targetFound) {
              console.warn(`Target not found for destroy effect: ${targetId}`);
            }
          });
        }
        break;

      case EffectTypeEnum.LIFE_GAIN:
        if (effect.value) {
          const newLifeTotal = controllerPlayer.lifeTotal + effect.value;
          updatePlayer(controller, {
            lifeTotal: newLifeTotal
          });
          alert(`${effect.description}: ${controllerPlayer.name} gains ${effect.value} life!`);
        }
        break;

      case EffectTypeEnum.SCRY:
        if (effect.value) {
          scry(controller, effect.value);
          alert(`${effect.description}: ${controllerPlayer.name} scries ${effect.value}!`);
        }
        break;

      default:
        alert(`${effect.description} resolves!`);
        break;
    }
  };

  // Targeting functions
  const startTargeting = (card: Card, targetType: string, requiredTargets: number) => {
    const player = getPlayer(activePlayerId);
    if (!player) return;

    console.log(`startTargeting called for ${card.name} with targetType: ${targetType}, requiredTargets: ${requiredTargets}`);

    updatePlayer(activePlayerId, {
      targetingState: {
        isTargeting: true,
        currentSpell: card,
        requiredTargets,
        selectedTargets: [],
        validTargets: [],
        targetType
      }
    });
  };

  const selectTarget = (targetId: string) => {
    const player = getPlayer(activePlayerId);
    if (!player) return;

    // Check if target is already selected - if so, remove it (toggle behavior)
    const isAlreadySelected = player.targetingState.selectedTargets.includes(targetId);
    
    updatePlayer(activePlayerId, {
      targetingState: {
        ...player.targetingState,
        selectedTargets: isAlreadySelected 
          ? player.targetingState.selectedTargets.filter(id => id !== targetId)
          : [...player.targetingState.selectedTargets, targetId]
      }
    });
  };

  const cancelTargeting = () => {
    const player = getPlayer(activePlayerId);
    if (!player) return;
    
    updatePlayer(activePlayerId, {
      targetingState: {
        ...player.targetingState,
        isTargeting: false,
        currentSpell: null,
        requiredTargets: 0,
        selectedTargets: [],
        validTargets: [],
        targetType: null
      }
    });
  };

  const confirmTargeting = () => {
    const player = getPlayer(activePlayerId);
    if (!player) return;

    const validTargets = getValidTargets(player.targetingState.targetType || '', activePlayerId);
    if (validTargets.length < player.targetingState.requiredTargets) {
      alert(`Not enough valid targets for ${player.targetingState.currentSpell?.name}.`);
      return;
    }

    // Add the spell to the stack with targets
    if (player.targetingState.currentSpell) {
      const stackItem: StackItem = {
        id: `${player.targetingState.currentSpell.id}-${Date.now()}`,
        type: 'spell',
        card: {
          ...player.targetingState.currentSpell,
          effects: player.targetingState.currentSpell.effects?.map(effect => ({
            ...effect,
            targets: effect.requiresTarget ? player.targetingState.selectedTargets : undefined
          }))
        },
        controller: activePlayerId,
        description: `Casting ${player.targetingState.currentSpell.name}`
      };

      addToStack(stackItem);

      // Remove card from hand (find the card by ID and remove the first occurrence)
      const cardIndex = player.drawnCards.findIndex(c => c.id === player.targetingState.currentSpell?.id);
      if (cardIndex !== -1) {
        const updatedDrawnCards = [...player.drawnCards];
        updatedDrawnCards.splice(cardIndex, 1);
        updatePlayer(activePlayerId, {
          drawnCards: updatedDrawnCards
        });
      }
    }

    // Clear targeting state
    updatePlayer(activePlayerId, {
      targetingState: {
        ...player.targetingState,
        isTargeting: false,
        currentSpell: null,
        requiredTargets: 0,
        selectedTargets: [],
        validTargets: [],
        targetType: null
      }
    });
  };

  const getValidTargets = (targetType: string, controller: string): Target[] => {
    const player = getPlayer(controller);
    if (!player) return [];

    console.log(`Getting valid targets for type: ${targetType}`);

    switch (targetType) {
      case 'creature': {
        // Return creatures from ALL players, not just the controller
        const allCreatures: Target[] = [];
        players.forEach(p => {
          p.creatures.forEach(c => {
            allCreatures.push({
              id: `${c.id}-${c.placedAt.getTime()}`,
              type: 'creature',
              controller: p.id,
              isValid: true
            });
          });
        });
        return allCreatures;
      }
      case 'land': {
        // Return lands from ALL players, not just the controller
        const allLands: Target[] = [];
        players.forEach(p => {
          p.lands.forEach(l => {
            allLands.push({
              id: `${l.id}-${l.placedAt.getTime()}`,
              type: 'land',
              controller: p.id,
              isValid: true
            });
          });
        });
        return allLands;
      }
      case 'player':
        // Return all players as valid targets
        return players.map(p => ({
          id: p.id,
          type: 'player',
          controller: p.id,
          isValid: true
        }));
      case 'creature_or_player': {
        // Return creatures and players from ALL players
        const targets: Target[] = [];
        
        // Add creatures from all players
        players.forEach(p => {
          p.creatures.forEach(c => {
            targets.push({
              id: `${c.id}-${c.placedAt.getTime()}`,
              type: 'creature',
              controller: p.id,
              isValid: true
            });
          });
        });
        
        // Add players
        players.forEach(p => {
          targets.push({
            id: p.id,
            type: 'player',
            controller: p.id,
            isValid: true
          });
        });
        
        console.log(`Returning ${targets.length} valid targets for creature_or_player:`, targets);
        return targets;
      }
      case 'any': {
        // Return all valid targets from ALL players
        const allTargets: Target[] = [];
        
        // Add creatures from all players
        players.forEach(p => {
          p.creatures.forEach(c => {
            allTargets.push({
              id: `${c.id}-${c.placedAt.getTime()}`,
              type: 'creature',
              controller: p.id,
              isValid: true
            });
          });
        });
        
        // Add lands from all players
        players.forEach(p => {
          p.lands.forEach(l => {
            allTargets.push({
              id: `${l.id}-${l.placedAt.getTime()}`,
              type: 'land',
              controller: p.id,
              isValid: true
            });
          });
        });
        
        // Add players
        players.forEach(p => {
          allTargets.push({
            id: p.id,
            type: 'player',
            controller: p.id,
            isValid: true
          });
        });
        
        return allTargets;
      }
      default:
        return [];
    }
  };

  const addExampleCardToHand = (playerId: string, card: Card) => {
    console.log('addExampleCardToHand called with:', { playerId, card }); // Debug log
    const player = getPlayer(playerId);
    if (!player) {
      console.log('Player not found:', playerId); // Debug log
      return;
    }

    const drawnCard: DrawnCard = {
      ...card,
      drawnAt: new Date(),
    };

    console.log('Adding drawn card:', drawnCard); // Debug log
    updatePlayer(playerId, {
      drawnCards: [...player.drawnCards, drawnCard]
    });
    console.log('Updated player hand size:', player.drawnCards.length + 1); // Debug log
  };

  // Activated abilities functions
  const canActivateAbility = (playerId: string, card: Card, ability: ActivatedAbility): boolean => {
    const player = getPlayer(playerId);
    if (!player) return false;

    // Check if it's the player's turn or if they have priority
    if (playerId !== activePlayerId && ability.cost !== 'T') {
      return false; // Most abilities can only be activated on your turn
    }

    // Check if ability cost can be paid
    if (ability.cost === 'T') {
      // Check if the card is on the battlefield and not tapped
      const cardOnBattlefield = player.creatures.find(c => c.id === card.id) || player.lands.find(l => l.id === card.id);
      if (!cardOnBattlefield) return false;
      
      // Check if the card is already tapped
      const cardIndex = player.creatures.findIndex(c => c.id === card.id);
      if (cardIndex !== -1) {
        // It's a creature
        const creatureInstanceId = `${card.id}-${cardIndex}`;
        return !player.tappedCreatures.has(creatureInstanceId);
      }
      
      // Check if it's a land
      const landIndex = player.lands.findIndex(l => l.id === card.id);
      if (landIndex !== -1) {
        const landInstanceId = `${card.id}-${landIndex}`;
        return !player.turnState.tappedLands.includes(landInstanceId);
      }
    } else {
      // Check mana cost
      const manaCost = parseInt(ability.cost) || 0;
      const totalMana = Object.values(player.turnState.manaPool).reduce((sum, amount) => sum + amount, 0);
      return totalMana >= manaCost;
    }

    return false;
  };

  const activateAbility = (playerId: string, card: Card, ability: ActivatedAbility) => {
    const player = getPlayer(playerId);
    if (!player) return;

    if (!canActivateAbility(playerId, card, ability)) {
      alert('Cannot activate this ability right now.');
      return;
    }

    // Pay the cost
    if (ability.cost === 'T') {
      // Tap the card
      const cardIndex = player.creatures.findIndex(c => c.id === card.id);
      if (cardIndex !== -1) {
        // It's a creature
        const creatureInstanceId = `${card.id}-${cardIndex}`;
        updatePlayer(playerId, {
          tappedCreatures: new Set([...player.tappedCreatures, creatureInstanceId])
        });
      } else {
        // It's a land
        const landIndex = player.lands.findIndex(l => l.id === card.id);
        if (landIndex !== -1) {
          const landInstanceId = `${card.id}-${landIndex}`;
          updatePlayer(playerId, {
            turnState: {
              ...player.turnState,
              tappedLands: [...player.turnState.tappedLands, landInstanceId]
            }
          });
        }
      }
    } else {
      // Pay mana cost
      const manaCost = parseInt(ability.cost) || 0;
      let remainingCost = manaCost;
      const manaToSpend = { ...player.turnState.manaPool };
      
      // Spend colorless mana first
      const colorlessToSpend = Math.min(manaToSpend.colorless, remainingCost);
      manaToSpend.colorless -= colorlessToSpend;
      remainingCost -= colorlessToSpend;
      
      // Then spend colored mana
      if (remainingCost > 0) {
        const coloredMana = ['white', 'blue', 'black', 'red', 'green'] as const;
        for (const color of coloredMana) {
          if (remainingCost <= 0) break;
          const toSpend = Math.min(manaToSpend[color], remainingCost);
          manaToSpend[color] -= toSpend;
          remainingCost -= toSpend;
        }
      }
      
      updatePlayer(playerId, {
        turnState: {
          ...player.turnState,
          manaPool: manaToSpend
        }
      });
    }

    // Handle the ability effect
    if (ability.effect.type === EffectTypeEnum.MANA) {
      // Mana abilities resolve immediately
      const manaType = ability.description.includes('{W}') ? 'white' :
                      ability.description.includes('{U}') ? 'blue' :
                      ability.description.includes('{B}') ? 'black' :
                      ability.description.includes('{R}') ? 'red' :
                      ability.description.includes('{G}') ? 'green' : 'colorless';
      
      updatePlayer(playerId, {
        turnState: {
          ...player.turnState,
          manaPool: {
            ...player.turnState.manaPool,
            [manaType]: player.turnState.manaPool[manaType] + (ability.effect.value || 1)
          }
        }
      });
      
      alert(`${card.name} adds ${ability.effect.value || 1} ${manaType} mana to your mana pool.`);
    } else if (ability.effect.requiresTarget) {
      // Start targeting for abilities that need targets
      startTargeting(card, ability.effect.targetType || 'creature_or_player', 1);
    } else {
      // Add to stack for other abilities
      const stackItem: StackItem = {
        id: `${card.id}-${ability.id}-${Date.now()}`,
        type: 'ability',
        card: card,
        controller: playerId,
        description: `${card.name}: ${ability.description}`
      };
      addToStack(stackItem);
    }
  };

  const getActivatableAbilities = (playerId: string, card: Card): ActivatedAbility[] => {
    if (!card.activatedAbilities) return [];
    
    return card.activatedAbilities.filter(ability => canActivateAbility(playerId, card, ability));
  };

  const contextValue: DeckContextType = {
    players,
    activePlayerId,
    setActivePlayer,
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
    shuffleDeck,
    scry,
    searchLibrary,
    selectCardFromSearch,
    handleScryDecision,
    getPlayer,
    isLand,
    isCreature,
    isEnchantment,
    isArtifact,
    isInstant,
    isSorcery,
    isPermanent,
    checkManaCost,
    spendManaForCard,
    addPlayer,
    removePlayer,
    toggleShowDeckActions,
    toggleSearch,
    closeScry,
    closeSearch,
    spendMana,
    resetSimulation,
    updateMaxHandSize,
    untapAllPermanents,
    advanceCombatStep,
    resolveCombatDamage,
    clearCombatState,
    declareAttacker,
    declareBlocker,
    resolveCombat,
    addToStack,
    passPriority,
    resolveTopOfStack,
    stack: stack,
    resolveSpellEffect,
    startTargeting,
    selectTarget,
    cancelTargeting,
    confirmTargeting,
    getValidTargets,
    addExampleCardToHand,
    // Damage system functions
    getCreatureToughness,
    getCreaturePower,
    dealDamageToCreature,
    clearDamageFromCreatures,
    // Activated abilities functions
    canActivateAbility,
    activateAbility,
    getActivatableAbilities
  };

  return (
    <DeckContext.Provider value={contextValue}>
      {children}
    </DeckContext.Provider>
  );
};

// Custom hook to use the deck context
export const useDeck = () => {
  const context = useContext(DeckContext);
  if (context === undefined) {
    throw new Error('useDeck must be used within a DeckProvider');
  }
  return context;
}; 