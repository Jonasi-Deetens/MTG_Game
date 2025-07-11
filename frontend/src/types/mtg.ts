export interface MTGCard {
  id: string;
  name: string;
  mana_cost?: string;
  cmc?: number;
  type_line?: string;
  oracle_text?: string;
  power?: string;
  toughness?: string;
  colors?: string[];
  image_uris?: Record<string, string>;
}

export interface DeckCard {
  card_id: string;
  quantity: number;
  card?: MTGCard;
  is_commander?: boolean;
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  cards: DeckCard[];
  created_at: string;
  updated_at: string;
  commander_name?: string;
  commander_id?: string;
  is_commander?: boolean;
}

export interface Hand {
  hand: MTGCard[];
  hand_size: number;
}

export interface GameState {
  deck: Deck;
  hand: MTGCard[];
  library: MTGCard[];
  graveyard: MTGCard[];
  exile: MTGCard[];
  turn: number;
  lifeTotal: number;
}

export interface SimulationResult {
  draws: MTGCard[][];
  turns: number;
}

export interface DeckAnalysis {
  total_cards: number;
  type_distribution: Record<string, number>;
  color_distribution: Record<string, number>;
  cmc_distribution: Record<number, number>;
}
