import type { Card, SpellEffect, Keyword, ActivatedAbility } from '../types/deck';
import { EffectType as EffectTypeEnum, Keyword as KeywordEnum } from '../types/deck';

// Predefined spell effects
export const SPELL_EFFECTS = {
  // Damage effects
  LIGHTNING_BOLT: {
    type: EffectTypeEnum.DAMAGE,
    value: 3,
    targetType: 'creature_or_player',
    description: 'Deal 3 damage to target creature or player',
    requiresTarget: true
  } as SpellEffect,

  FIREBALL: {
    type: EffectTypeEnum.DAMAGE,
    value: 2,
    targetType: 'creature_or_player',
    description: 'Deal 2 damage to target creature or player',
    requiresTarget: true
  } as SpellEffect,

  // Draw effects
  DIVINATION: {
    type: EffectTypeEnum.DRAW,
    value: 2,
    description: 'Draw 2 cards',
    requiresTarget: false
  } as SpellEffect,

  ANCIENT_CRAVINGS: {
    type: EffectTypeEnum.DRAW,
    value: 3,
    description: 'Draw 3 cards',
    requiresTarget: false
  } as SpellEffect,

  // Life gain effects
  HEALING_SALVE: {
    type: EffectTypeEnum.LIFE_GAIN,
    value: 3,
    description: 'Gain 3 life',
    requiresTarget: false
  } as SpellEffect,

  // Destroy effects
  DOOM_BLADE: {
    type: EffectTypeEnum.DESTROY,
    targetType: 'creature',
    description: 'Destroy target creature',
    requiresTarget: true
  } as SpellEffect,

  // Scry effects
  PRECOGNITION: {
    type: EffectTypeEnum.SCRY,
    value: 3,
    description: 'Scry 3',
    requiresTarget: false
  } as SpellEffect,

  // Combined effects
  LIGHTNING_HELIX: [
    {
      type: EffectTypeEnum.DAMAGE,
      value: 3,
      targetType: 'creature_or_player',
      description: 'Deal 3 damage to target creature or player',
      requiresTarget: true
    },
    {
      type: EffectTypeEnum.LIFE_GAIN,
      value: 3,
      description: 'Gain 3 life',
      requiresTarget: false
    }
  ] as SpellEffect[]
};

// Predefined keywords
export const KEYWORDS = {
  FLYING: KeywordEnum.FLYING,
  FIRST_STRIKE: KeywordEnum.FIRST_STRIKE,
  DOUBLE_STRIKE: KeywordEnum.DOUBLE_STRIKE,
  TRAMPLE: KeywordEnum.TRAMPLE,
  VIGILANCE: KeywordEnum.VIGILANCE,
  HASTE: KeywordEnum.HASTE,
  LIFELINK: KeywordEnum.LIFELINK,
  DEATHTOUCH: KeywordEnum.DEATHTOUCH,
  REACH: KeywordEnum.REACH,
  HEXPROOF: KeywordEnum.HEXPROOF,
  INDESTRUCTIBLE: KeywordEnum.INDESTRUCTIBLE
};

// Activated abilities for common MTG cards
export const ACTIVATED_ABILITIES = {
  // Tap abilities
  TAP_DEAL_DAMAGE: {
    id: 'tap_deal_damage',
    cost: 'T', // T means tap
    effect: {
      type: EffectTypeEnum.DAMAGE,
      value: 1,
      targetType: 'creature_or_player',
      description: 'Deal 1 damage to target creature or player',
      requiresTarget: true
    },
    description: '{T}: Deal 1 damage to target creature or player'
  } as ActivatedAbility,

  TAP_DEAL_2_DAMAGE: {
    id: 'tap_deal_2_damage',
    cost: 'T',
    effect: {
      type: EffectTypeEnum.DAMAGE,
      value: 2,
      targetType: 'creature_or_player',
      description: 'Deal 2 damage to target creature or player',
      requiresTarget: true
    },
    description: '{T}: Deal 2 damage to target creature or player'
  } as ActivatedAbility,

  TAP_DRAW_CARD: {
    id: 'tap_draw_card',
    cost: 'T',
    effect: {
      type: EffectTypeEnum.DRAW,
      value: 1,
      description: 'Draw a card',
      requiresTarget: false
    },
    description: '{T}: Draw a card'
  } as ActivatedAbility,

  TAP_GAIN_LIFE: {
    id: 'tap_gain_life',
    cost: 'T',
    effect: {
      type: EffectTypeEnum.LIFE_GAIN,
      value: 2,
      description: 'Gain 2 life',
      requiresTarget: false
    },
    description: '{T}: Gain 2 life'
  } as ActivatedAbility,

  TAP_SCRY: {
    id: 'tap_scry',
    cost: 'T',
    effect: {
      type: EffectTypeEnum.SCRY,
      value: 1,
      description: 'Scry 1',
      requiresTarget: false
    },
    description: '{T}: Scry 1'
  } as ActivatedAbility,

  // Mana abilities
  TAP_ADD_WHITE: {
    id: 'tap_add_white',
    cost: 'T',
    effect: {
      type: EffectTypeEnum.MANA,
      value: 1,
      description: 'Add {W}',
      requiresTarget: false
    },
    description: '{T}: Add {W}'
  } as ActivatedAbility,

  TAP_ADD_BLUE: {
    id: 'tap_add_blue',
    cost: 'T',
    effect: {
      type: EffectTypeEnum.MANA,
      value: 1,
      description: 'Add {U}',
      requiresTarget: false
    },
    description: '{T}: Add {U}'
  } as ActivatedAbility,

  TAP_ADD_BLACK: {
    id: 'tap_add_black',
    cost: 'T',
    effect: {
      type: EffectTypeEnum.MANA,
      value: 1,
      description: 'Add {B}',
      requiresTarget: false
    },
    description: '{T}: Add {B}'
  } as ActivatedAbility,

  TAP_ADD_RED: {
    id: 'tap_add_red',
    cost: 'T',
    effect: {
      type: EffectTypeEnum.MANA,
      value: 1,
      description: 'Add {R}',
      requiresTarget: false
    },
    description: '{T}: Add {R}'
  } as ActivatedAbility,

  TAP_ADD_GREEN: {
    id: 'tap_add_green',
    cost: 'T',
    effect: {
      type: EffectTypeEnum.MANA,
      value: 1,
      description: 'Add {G}',
      requiresTarget: false
    },
    description: '{T}: Add {G}'
  } as ActivatedAbility,

  TAP_ADD_COLORLESS: {
    id: 'tap_add_colorless',
    cost: 'T',
    effect: {
      type: EffectTypeEnum.MANA,
      value: 1,
      description: 'Add {C}',
      requiresTarget: false
    },
    description: '{T}: Add {C}'
  } as ActivatedAbility,

  // Paid abilities
  PAID_DEAL_DAMAGE: {
    id: 'paid_deal_damage',
    cost: '2',
    effect: {
      type: EffectTypeEnum.DAMAGE,
      value: 3,
      targetType: 'creature_or_player',
      description: 'Deal 3 damage to target creature or player',
      requiresTarget: true
    },
    description: '{2}: Deal 3 damage to target creature or player'
  } as ActivatedAbility,

  PAID_DRAW_CARD: {
    id: 'paid_draw_card',
    cost: '3',
    effect: {
      type: EffectTypeEnum.DRAW,
      value: 1,
      description: 'Draw a card',
      requiresTarget: false
    },
    description: '{3}: Draw a card'
  } as ActivatedAbility
};

// Function to add effects to a card
export const addEffectsToCard = (card: Card, effects: SpellEffect | SpellEffect[]): Card => {
  const cardEffects = Array.isArray(effects) ? effects : [effects];
  return {
    ...card,
    effects: cardEffects
  };
};

// Function to add keywords to a card
export const addKeywordsToCard = (card: Card, keywords: Keyword[]): Card => {
  return {
    ...card,
    keywords: keywords
  };
};

// Function to create a card with effects
export const createCardWithEffects = (
  baseCard: Card, 
  effects?: SpellEffect | SpellEffect[], 
  keywords?: Keyword[],
  activatedAbilities?: ActivatedAbility[]
): Card => {
  return {
    ...baseCard,
    effects: effects ? (Array.isArray(effects) ? effects : [effects]) : baseCard.effects,
    keywords: keywords ? [...(baseCard.keywords || []), ...keywords] : baseCard.keywords,
    activatedAbilities: activatedAbilities ? [...(baseCard.activatedAbilities || []), ...activatedAbilities] : baseCard.activatedAbilities
  };
};

// Example cards with effects
export const EXAMPLE_CARDS = {
  // Instants
  LIGHTNING_BOLT: createCardWithEffects(
    {
      id: 1001,
      name: 'Lightning Bolt',
      mana_cost: '{R}',
      cmc: 1,
      type: 'Instant',
      text: 'Lightning Bolt deals 3 damage to any target.',
      image_url: 'https://cards.scryfall.io/normal/front/0/9/09b5c6e7-8b1a-4b5d-9c1d-8e9f0a1b2c3d.jpg'
    },
    SPELL_EFFECTS.LIGHTNING_BOLT
  ),

  FIREBALL: createCardWithEffects(
    {
      id: 1002,
      name: 'Fireball',
      mana_cost: '{X}{R}',
      cmc: 1,
      type: 'Sorcery',
      text: 'Fireball deals X damage to target creature or player.',
      image_url: 'https://cards.scryfall.io/normal/front/1/1/11b5c6e7-8b1a-4b5d-9c1d-8e9f0a1b2c3d.jpg'
    },
    SPELL_EFFECTS.FIREBALL
  ),

  DIVINATION: createCardWithEffects(
    {
      id: 1003,
      name: 'Divination',
      mana_cost: '{2}{U}',
      cmc: 3,
      type: 'Sorcery',
      text: 'Draw two cards.',
      image_url: 'https://cards.scryfall.io/normal/front/2/2/22b5c6e7-8b1a-4b5d-9c1d-8e9f0a1b2c3d.jpg'
    },
    SPELL_EFFECTS.DIVINATION
  ),

  ANCIENT_CRAVINGS: createCardWithEffects(
    {
      id: 1004,
      name: 'Ancient Craving',
      mana_cost: '{3}{B}',
      cmc: 4,
      type: 'Sorcery',
      text: 'Draw three cards.',
      image_url: 'https://cards.scryfall.io/normal/front/3/3/33b5c6e7-8b1a-4b5d-9c1d-8e9f0a1b2c3d.jpg'
    },
    SPELL_EFFECTS.ANCIENT_CRAVINGS
  ),

  HEALING_SALVE: createCardWithEffects(
    {
      id: 1005,
      name: 'Healing Salve',
      mana_cost: '{W}',
      cmc: 1,
      type: 'Instant',
      text: 'Gain 3 life.',
      image_url: 'https://cards.scryfall.io/normal/front/4/4/44b5c6e7-8b1a-4b5d-9c1d-8e9f0a1b2c3d.jpg'
    },
    SPELL_EFFECTS.HEALING_SALVE
  ),

  DOOM_BLADE: createCardWithEffects(
    {
      id: 1006,
      name: 'Doom Blade',
      mana_cost: '{1}{B}',
      cmc: 2,
      type: 'Instant',
      text: 'Destroy target nonblack creature.',
      image_url: 'https://cards.scryfall.io/normal/front/5/5/55b5c6e7-8b1a-4b5d-9c1d-8e9f0a1b2c3d.jpg'
    },
    SPELL_EFFECTS.DOOM_BLADE
  ),

  PRECOGNITION: createCardWithEffects(
    {
      id: 1007,
      name: 'Precognition',
      mana_cost: '{1}{U}',
      cmc: 2,
      type: 'Instant',
      text: 'Scry 3.',
      image_url: 'https://cards.scryfall.io/normal/front/6/6/66b5c6e7-8b1a-4b5d-9c1d-8e9f0a1b2c3d.jpg'
    },
    SPELL_EFFECTS.PRECOGNITION
  ),

  LIGHTNING_HELIX: createCardWithEffects(
    {
      id: 1008,
      name: 'Lightning Helix',
      mana_cost: '{R}{W}',
      cmc: 2,
      type: 'Instant',
      text: 'Lightning Helix deals 3 damage to target creature or player and you gain 3 life.',
      image_url: 'https://cards.scryfall.io/normal/front/7/7/77b5c6e7-8b1a-4b5d-9c1d-8e9f0a1b2c3d.jpg'
    },
    SPELL_EFFECTS.LIGHTNING_HELIX
  ),

  // Creatures with keywords
  GRIFFIN_SENTINEL: createCardWithEffects(
    {
      id: 1009,
      name: 'Griffin Sentinel',
      mana_cost: '{2}{W}',
      cmc: 3,
      type: 'Creature — Griffin',
      text: 'Flying, Vigilance',
      power: '2',
      toughness: '3',
      image_url: 'https://cards.scryfall.io/normal/front/8/8/88b5c6e7-8b1a-4b5d-9c1d-8e9f0a1b2c3d.jpg'
    },
    undefined,
    [KEYWORDS.FLYING, KEYWORDS.VIGILANCE]
  ),

  GOBLIN_RAIDER: createCardWithEffects(
    {
      id: 1010,
      name: 'Goblin Raider',
      mana_cost: '{1}{R}',
      cmc: 2,
      type: 'Creature — Goblin',
      text: 'Haste',
      power: '2',
      toughness: '1',
      image_url: 'https://cards.scryfall.io/normal/front/9/9/99b5c6e7-8b1a-4b5d-9c1d-8e9f0a1b2c3d.jpg'
    },
    undefined,
    [KEYWORDS.HASTE]
  ),

  DEATHTOUCH_ASSASSIN: createCardWithEffects(
    {
      id: 1011,
      name: 'Deathtouch Assassin',
      mana_cost: '{2}{B}',
      cmc: 3,
      type: 'Creature — Human Assassin',
      text: 'Deathtouch',
      power: '1',
      toughness: '1',
      image_url: 'https://cards.scryfall.io/normal/front/a/a/aab5c6e7-8b1a-4b5d-9c1d-8e9f0a1b2c3d.jpg'
    },
    undefined,
    [KEYWORDS.DEATHTOUCH]
  )
};

// Function to get all example cards
export const getAllExampleCards = (): Card[] => {
  return [
    // Creatures with activated abilities
    createCardWithEffects({
      id: 10001,
      name: 'Prodigal Pyromancer',
      type: 'Creature — Human Wizard',
      mana_cost: '2R',
      cmc: 3,
      power: '1',
      toughness: '1',
      text: '{T}: Prodigal Pyromancer deals 1 damage to target creature or player.',
      image_url: '/api/placeholder/223/310'
    }, undefined, undefined, [ACTIVATED_ABILITIES.TAP_DEAL_DAMAGE]),

    createCardWithEffects({
      id: 10002,
      name: 'Llanowar Elves',
      type: 'Creature — Elf Druid',
      mana_cost: 'G',
      cmc: 1,
      power: '1',
      toughness: '1',
      text: '{T}: Add {G}.',
      image_url: '/api/placeholder/223/310'
    }, undefined, undefined, [ACTIVATED_ABILITIES.TAP_ADD_GREEN]),

    createCardWithEffects({
      id: 10003,
      name: 'Elvish Mystic',
      type: 'Creature — Elf Druid',
      mana_cost: 'G',
      cmc: 1,
      power: '1',
      toughness: '1',
      text: '{T}: Add {G}.',
      image_url: '/api/placeholder/223/310'
    }, undefined, undefined, [ACTIVATED_ABILITIES.TAP_ADD_GREEN]),

    createCardWithEffects({
      id: 10004,
      name: 'Birds of Paradise',
      type: 'Creature — Bird',
      mana_cost: 'G',
      cmc: 1,
      power: '0',
      toughness: '1',
      text: '{T}: Add one mana of any color.',
      keywords: [KeywordEnum.FLYING],
      image_url: '/api/placeholder/223/310'
    }, undefined, undefined, [ACTIVATED_ABILITIES.TAP_ADD_GREEN, ACTIVATED_ABILITIES.TAP_ADD_WHITE, ACTIVATED_ABILITIES.TAP_ADD_BLUE, ACTIVATED_ABILITIES.TAP_ADD_BLACK, ACTIVATED_ABILITIES.TAP_ADD_RED]),

    createCardWithEffects({
      id: 10005,
      name: 'Merfolk Looter',
      type: 'Creature — Merfolk Rogue',
      mana_cost: '1U',
      cmc: 2,
      power: '1',
      toughness: '1',
      text: '{T}: Draw a card, then discard a card.',
      image_url: '/api/placeholder/223/310'
    }, undefined, undefined, [ACTIVATED_ABILITIES.TAP_DRAW_CARD]),

    createCardWithEffects({
      id: 10006,
      name: 'Soul Warden',
      type: 'Creature — Human Cleric',
      mana_cost: 'W',
      cmc: 1,
      power: '1',
      toughness: '1',
      text: 'Whenever another creature enters the battlefield, you gain 1 life. {T}: Gain 2 life.',
      image_url: '/api/placeholder/223/310'
    }, undefined, undefined, [ACTIVATED_ABILITIES.TAP_GAIN_LIFE]),

    createCardWithEffects({
      id: 10007,
      name: 'Goblin Sharpshooter',
      type: 'Creature — Goblin',
      mana_cost: '2R',
      cmc: 3,
      power: '1',
      toughness: '1',
      text: '{T}: Goblin Sharpshooter deals 1 damage to target creature or player.',
      image_url: '/api/placeholder/223/310'
    }, undefined, undefined, [ACTIVATED_ABILITIES.TAP_DEAL_DAMAGE]),

    createCardWithEffects({
      id: 10008,
      name: 'Fireball Wizard',
      type: 'Creature — Human Wizard',
      mana_cost: '3R',
      cmc: 4,
      power: '2',
      toughness: '2',
      text: '{2}: Deal 3 damage to target creature or player.',
      image_url: '/api/placeholder/223/310'
    }, undefined, undefined, [ACTIVATED_ABILITIES.PAID_DEAL_DAMAGE]),

    createCardWithEffects({
      id: 10009,
      name: 'Sage of Mysteries',
      type: 'Creature — Human Wizard',
      mana_cost: '2U',
      cmc: 3,
      power: '1',
      toughness: '3',
      text: '{T}: Scry 1. {3}: Draw a card.',
      image_url: '/api/placeholder/223/310'
    }, undefined, undefined, [ACTIVATED_ABILITIES.TAP_SCRY, ACTIVATED_ABILITIES.PAID_DRAW_CARD]),

    // Artifacts with activated abilities
    createCardWithEffects({
      id: 10010,
      name: 'Sol Ring',
      type: 'Artifact',
      mana_cost: '1',
      cmc: 1,
      text: '{T}: Add {C}{C}.',
      image_url: '/api/placeholder/223/310'
    }, undefined, undefined, [ACTIVATED_ABILITIES.TAP_ADD_COLORLESS, ACTIVATED_ABILITIES.TAP_ADD_COLORLESS]),

    createCardWithEffects({
      id: 10011,
      name: 'Pithing Needle',
      type: 'Artifact',
      mana_cost: '1',
      cmc: 1,
      text: 'As Pithing Needle enters the battlefield, choose a card name. Activated abilities of sources with the chosen name can\'t be activated.',
      image_url: '/api/placeholder/223/310'
    }),

    createCardWithEffects({
      id: 10012,
      name: 'Jayemdae Tome',
      type: 'Artifact',
      mana_cost: '4',
      cmc: 4,
      text: '{4}: Draw a card.',
      image_url: '/api/placeholder/223/310'
    }, undefined, undefined, [ACTIVATED_ABILITIES.PAID_DRAW_CARD]),

    // Lands with activated abilities
    createCardWithEffects({
      id: 10013,
      name: 'Mishra\'s Factory',
      type: 'Land',
      mana_cost: '',
      cmc: 0,
      text: '{T}: Add {C}. {1}: Mishra\'s Factory becomes a 2/2 Assembly-Worker artifact creature until end of turn.',
      image_url: '/api/placeholder/223/310'
    }, undefined, undefined, [ACTIVATED_ABILITIES.TAP_ADD_COLORLESS]),

    createCardWithEffects({
      id: 10014,
      name: 'Treetop Village',
      type: 'Land',
      mana_cost: '',
      cmc: 0,
      text: '{T}: Add {G}. {1}{G}: Treetop Village becomes a 3/3 green Ape creature with trample until end of turn.',
      image_url: '/api/placeholder/223/310'
    }, undefined, undefined, [ACTIVATED_ABILITIES.TAP_ADD_GREEN]),

    // ... existing cards ...
    createCardWithEffects({
      id: 1001,
      name: 'Lightning Bolt',
      type: 'Instant',
      mana_cost: '1R',
      cmc: 2,
      text: 'Lightning Bolt deals 3 damage to target creature or player.',
      image_url: '/api/placeholder/223/310'
    }, SPELL_EFFECTS.LIGHTNING_BOLT),

    createCardWithEffects({
      id: 1002,
      name: 'Divination',
      type: 'Sorcery',
      mana_cost: '2U',
      cmc: 3,
      text: 'Draw two cards.',
      image_url: '/api/placeholder/223/310'
    }, SPELL_EFFECTS.DIVINATION),

    createCardWithEffects({
      id: 1003,
      name: 'Doom Blade',
      type: 'Instant',
      mana_cost: '1B',
      cmc: 2,
      text: 'Destroy target creature.',
      image_url: '/api/placeholder/223/310'
    }, SPELL_EFFECTS.DOOM_BLADE),

    createCardWithEffects({
      id: 1004,
      name: 'Lightning Helix',
      type: 'Instant',
      mana_cost: 'RW',
      cmc: 2,
      text: 'Lightning Helix deals 3 damage to target creature or player and you gain 3 life.',
      image_url: '/api/placeholder/223/310'
    }, SPELL_EFFECTS.LIGHTNING_HELIX),

    createCardWithEffects({
      id: 1005,
      name: 'Healing Salve',
      type: 'Instant',
      mana_cost: 'W',
      cmc: 1,
      text: 'You gain 3 life.',
      image_url: '/api/placeholder/223/310'
    }, SPELL_EFFECTS.HEALING_SALVE),

    createCardWithEffects({
      id: 1006,
      name: 'Precognition',
      type: 'Sorcery',
      mana_cost: '1U',
      cmc: 2,
      text: 'Scry 3.',
      image_url: '/api/placeholder/223/310'
    }, SPELL_EFFECTS.PRECOGNITION),

    createCardWithEffects({
      id: 1007,
      name: 'Fireball',
      type: 'Sorcery',
      mana_cost: '1R',
      cmc: 2,
      text: 'Fireball deals 2 damage to target creature or player.',
      image_url: '/api/placeholder/223/310'
    }, SPELL_EFFECTS.FIREBALL),

    createCardWithEffects({
      id: 1008,
      name: 'Ancient Cravings',
      type: 'Sorcery',
      mana_cost: '2B',
      cmc: 3,
      text: 'Draw three cards.',
      image_url: '/api/placeholder/223/310'
    }, SPELL_EFFECTS.ANCIENT_CRAVINGS),

    // Basic creatures without abilities
    createCardWithEffects({
      id: 2001,
      name: 'Grizzly Bears',
      type: 'Creature — Bear',
      mana_cost: '1G',
      cmc: 2,
      power: '2',
      toughness: '2',
      text: 'A bear.',
      image_url: '/api/placeholder/223/310'
    }),

    createCardWithEffects({
      id: 2002,
      name: 'Serra Angel',
      type: 'Creature — Angel',
      mana_cost: '3WW',
      cmc: 5,
      power: '4',
      toughness: '4',
      text: 'Flying, vigilance',
      keywords: [KeywordEnum.FLYING, KeywordEnum.VIGILANCE],
      image_url: '/api/placeholder/223/310'
    }),

    createCardWithEffects({
      id: 2003,
      name: 'Shivan Dragon',
      type: 'Creature — Dragon',
      mana_cost: '4RR',
      cmc: 6,
      power: '5',
      toughness: '5',
      text: 'Flying',
      keywords: [KeywordEnum.FLYING],
      image_url: '/api/placeholder/223/310'
    }),

    createCardWithEffects({
      id: 2004,
      name: 'Lightning Elemental',
      type: 'Creature — Elemental',
      mana_cost: '2R',
      cmc: 3,
      power: '2',
      toughness: '1',
      text: 'Haste',
      keywords: [KeywordEnum.HASTE],
      image_url: '/api/placeholder/223/310'
    }),

    createCardWithEffects({
      id: 2005,
      name: 'Vampire Nighthawk',
      type: 'Creature — Vampire Shaman',
      mana_cost: '1BB',
      cmc: 3,
      power: '2',
      toughness: '3',
      text: 'Flying, deathtouch, lifelink',
      keywords: [KeywordEnum.FLYING, KeywordEnum.DEATHTOUCH, KeywordEnum.LIFELINK],
      image_url: '/api/placeholder/223/310'
    }),

    createCardWithEffects({
      id: 2006,
      name: 'Woolly Thoctar',
      type: 'Creature — Beast',
      mana_cost: '1RGW',
      cmc: 3,
      power: '5',
      toughness: '4',
      text: 'Trample',
      keywords: [KeywordEnum.TRAMPLE],
      image_url: '/api/placeholder/223/310'
    }),

    createCardWithEffects({
      id: 2007,
      name: 'Savannah Lions',
      type: 'Creature — Cat',
      mana_cost: 'W',
      cmc: 1,
      power: '2',
      toughness: '1',
      text: 'A fast, noble cat.',
      image_url: '/api/placeholder/223/310'
    }),

    createCardWithEffects({
      id: 2008,
      name: 'Giant Spider',
      type: 'Creature — Spider',
      mana_cost: '3G',
      cmc: 4,
      power: '2',
      toughness: '4',
      text: 'Reach',
      keywords: [KeywordEnum.REACH],
      image_url: '/api/placeholder/223/310'
    }),

    // Basic lands
    createCardWithEffects({
      id: 3001,
      name: 'Plains',
      type: 'Basic Land — Plains',
      mana_cost: '',
      cmc: 0,
      text: '{T}: Add {W}.',
      image_url: '/api/placeholder/223/310'
    }, undefined, undefined, [ACTIVATED_ABILITIES.TAP_ADD_WHITE]),

    createCardWithEffects({
      id: 3002,
      name: 'Island',
      type: 'Basic Land — Island',
      mana_cost: '',
      cmc: 0,
      text: '{T}: Add {U}.',
      image_url: '/api/placeholder/223/310'
    }, undefined, undefined, [ACTIVATED_ABILITIES.TAP_ADD_BLUE]),

    createCardWithEffects({
      id: 3003,
      name: 'Swamp',
      type: 'Basic Land — Swamp',
      mana_cost: '',
      cmc: 0,
      text: '{T}: Add {B}.',
      image_url: '/api/placeholder/223/310'
    }, undefined, undefined, [ACTIVATED_ABILITIES.TAP_ADD_BLACK]),

    createCardWithEffects({
      id: 3004,
      name: 'Mountain',
      type: 'Basic Land — Mountain',
      mana_cost: '',
      cmc: 0,
      text: '{T}: Add {R}.',
      image_url: '/api/placeholder/223/310'
    }, undefined, undefined, [ACTIVATED_ABILITIES.TAP_ADD_RED]),

    createCardWithEffects({
      id: 3005,
      name: 'Forest',
      type: 'Basic Land — Forest',
      mana_cost: '',
      cmc: 0,
      text: '{T}: Add {G}.',
      image_url: '/api/placeholder/223/310'
    }, undefined, undefined, [ACTIVATED_ABILITIES.TAP_ADD_GREEN])
  ];
};

// Function to get example cards by type
export const getExampleCardsByType = (type: string): Card[] => {
  return getAllExampleCards().filter(card => 
    card.type?.toLowerCase().includes(type.toLowerCase())
  );
}; 

// Create a mapping of card names to their effects for easy lookup
export const CARD_EFFECTS_MAP = new Map<string, Partial<Card>>();

// Populate the map with all our example cards
const initializeCardEffectsMap = () => {
  if (CARD_EFFECTS_MAP.size > 0) return; // Already initialized
  
  const allCards = getAllExampleCards();
  allCards.forEach(card => {
    // Use the card name as the key, normalized to lowercase for case-insensitive matching
    const normalizedName = card.name.toLowerCase().trim();
    CARD_EFFECTS_MAP.set(normalizedName, {
      keywords: card.keywords,
      effects: card.effects,
      activatedAbilities: card.activatedAbilities
    });
  });
};

// Function to enhance a basic card with MTG effects based on card name
export const enhanceCardWithEffects = (basicCard: Card): Card => {
  // Initialize the map if needed
  initializeCardEffectsMap();
  
  const normalizedName = basicCard.name.toLowerCase().trim();
  const cardEffects = CARD_EFFECTS_MAP.get(normalizedName);
  
  if (cardEffects) {
    return {
      ...basicCard,
      keywords: cardEffects.keywords || basicCard.keywords,
      effects: cardEffects.effects || basicCard.effects,
      activatedAbilities: cardEffects.activatedAbilities || basicCard.activatedAbilities
    };
  }
  
  // If no effects found, return the card as-is
  return basicCard;
};

// Function to enhance multiple cards
export const enhanceCardsWithEffects = (cards: Card[]): Card[] => {
  return cards.map(enhanceCardWithEffects);
};

// Function to check if a card has custom effects defined
export const hasCustomEffects = (cardName: string): boolean => {
  initializeCardEffectsMap();
  const normalizedName = cardName.toLowerCase().trim();
  return CARD_EFFECTS_MAP.has(normalizedName);
};

// Function to get all card names that have custom effects defined
export const getCardsWithCustomEffects = (): string[] => {
  initializeCardEffectsMap();
  return Array.from(CARD_EFFECTS_MAP.keys());
}; 