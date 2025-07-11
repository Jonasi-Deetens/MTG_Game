export interface LegendaryCreature {
  id: string;
  name: string;
  mana_cost?: string;
}

export interface Deck {
  id: number;
  name: string;
  description: string;
  commander_id?: string;
  cards: Card[];
  legendary_creatures: LegendaryCreature[];
  created_at: string;
  updated_at: string;
}

export interface DeckFormData {
  name: string;
  description: string;
  commander_id?: string;
  deck_list: Array<{
    quantity: number;
    name: string;
  }>;
}

export interface CardSearchResult {
  id: string;
  name: string;
  mana_cost?: string;
  type?: string;
  image_url?: string;
}

// Phase system types
export const Phase = {
  BEGINNING: 'beginning',
  PRECOMBAT_MAIN: 'precombat_main',
  COMBAT: 'combat',
  POSTCOMBAT_MAIN: 'postcombat_main',
  ENDING: 'ending'
} as const;

export type Phase = typeof Phase[keyof typeof Phase];

// Turn steps within phases
export const Step = {
  // Beginning Phase Steps
  UNTAP: 'untap',
  UPKEEP: 'upkeep',
  DRAW: 'draw',
  
  // Combat Phase Steps
  BEGINNING_OF_COMBAT: 'beginning_of_combat',
  DECLARE_ATTACKERS: 'declare_attackers',
  DECLARE_BLOCKERS: 'declare_blockers',
  FIRST_STRIKE_DAMAGE: 'first_strike_damage',
  COMBAT_DAMAGE: 'combat_damage',
  END_OF_COMBAT: 'end_of_combat',
  
  // Ending Phase Steps
  END_STEP: 'end_step',
  CLEANUP: 'cleanup'
} as const;

export type Step = typeof Step[keyof typeof Step];

// Spell effect types
export const EffectType = {
  DAMAGE: 'damage',
  DRAW: 'draw',
  DESTROY: 'destroy',
  EXILE: 'exile',
  BOUNCE: 'bounce',
  BUFF: 'buff',
  DEBUFF: 'debuff',
  LIFE_GAIN: 'life_gain',
  LIFE_LOSS: 'life_loss',
  SEARCH: 'search',
  SCRY: 'scry',
  MANA: 'mana'
} as const;

export type EffectType = typeof EffectType[keyof typeof EffectType];

// Targeting types
export const TargetType = {
  CREATURE: 'creature',
  PLAYER: 'player',
  LAND: 'land',
  ARTIFACT: 'artifact',
  ENCHANTMENT: 'enchantment',
  SPELL: 'spell',
  ANY: 'any',
  CREATURE_OR_PLAYER: 'creature_or_player'
} as const;

export type TargetType = typeof TargetType[keyof typeof TargetType];

// Keywords
export const Keyword = {
  FLYING: 'flying',
  FIRST_STRIKE: 'first_strike',
  DOUBLE_STRIKE: 'double_strike',
  TRAMPLE: 'trample',
  VIGILANCE: 'vigilance',
  HASTE: 'haste',
  LIFELINK: 'lifelink',
  DEATHTOUCH: 'deathtouch',
  REACH: 'reach',
  HEXPROOF: 'hexproof',
  INDESTRUCTIBLE: 'indestructible'
} as const;

export type Keyword = typeof Keyword[keyof typeof Keyword];

// Spell effect interface
export interface SpellEffect {
  type: EffectType;
  value?: number;
  targetType?: TargetType;
  description: string;
  requiresTarget?: boolean;
  targets?: string[]; // IDs of targeted objects
}

// Context for ability activation
export interface AbilityContext {
  playerId: string;
  phase: Phase;
  step: Step;
  hasPriority: boolean;
  canPayCost: boolean;
}

// Target interface
export interface Target {
  id: string;
  type: TargetType;
  controller: string;
  isValid: boolean;
}

// Activated ability interface
export interface ActivatedAbility {
  id: string;
  cost: string; // e.g., "Tap", "1", "Tap, 1"
  effect: SpellEffect;
  description: string;
  canActivate?: (context: AbilityContext) => boolean;
}

// Enhanced Card interface with abilities and keywords
export interface Card {
  id: number;
  name: string;
  mana_cost?: string;
  cmc?: number;
  type?: string;
  text?: string;
  power?: string;
  toughness?: string;
  image_url?: string;
  rarity?: string;
  set_name?: string;
  keywords?: Keyword[];
  effects?: SpellEffect[];
  activatedAbilities?: ActivatedAbility[];
  canTarget?: (target: Target) => boolean;
  quantity?: number; // Number of copies in deck
  
  // Database fields
  scryfall_id?: string;
  type_line?: string;
  oracle_text?: string;
  colors?: string[];
  set_code?: string;
  collector_number?: string;
  prices?: any;
  legalities?: any;
  flavor_text?: string;
  artist?: string;
  
  // AI-generated fields
  ai_generated_effects?: SpellEffect[];
  ai_generated_abilities?: ActivatedAbility[];
  ai_generated_keywords?: Keyword[];
  ai_effect_description?: string;
  ai_strategic_value?: string;
  ai_combo_potential?: string;
}

export interface PhaseInfo {
  id: Phase;
  name: string;
  icon: string;
  description: string;
  color: string;
  steps?: Step[];
}

export interface StepInfo {
  id: Step;
  name: string;
  description: string;
  phase: Phase;
}

export interface TurnState {
  turnNumber: number;
  currentPhase: Phase;
  currentStep: Step;
  isActivePlayer: boolean;
  hasDrawnForTurn: boolean;
  hasPlayedLand: boolean;
  maxHandSize: number;
  manaPool: {
    white: number;
    blue: number;
    black: number;
    red: number;
    green: number;
    colorless: number;
  };
  landsTapped: boolean;
  tappedLands: string[];
  manaSources: {
    [landId: string]: {
      landId: string;
      manaType: 'white' | 'blue' | 'black' | 'red' | 'green' | 'colorless';
      available: boolean;
    };
  };
  landManaUsed: string[];
  // New fields for proper turn structure
  hasUntappedThisTurn: boolean;
  hasResolvedUpkeep: boolean;
  hasResolvedEndStep: boolean;
} 