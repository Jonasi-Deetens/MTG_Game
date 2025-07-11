// MTG API service for frontend card data fetching
// Using the Scryfall API which is more reliable and comprehensive

export interface ScryfallCard {
  id: string;
  name: string;
  mana_cost?: string;
  cmc?: number;
  colors?: string[];
  type_line?: string;
  oracle_text?: string;
  power?: string;
  toughness?: string;
  image_uris?: {
    small?: string;
    normal?: string;
    large?: string;
  };
  rarity?: string;
  set_name?: string;
  collector_number?: string;
  legalities?: Record<string, string>;
  keywords?: string[];
  flavor_text?: string;
  artist?: string;
  prices?: {
    usd?: string;
    usd_foil?: string;
    usd_etched?: string;
  };
}

export interface CardSearchResult {
  id: string;
  name: string;
  mana_cost?: string;
  type_line?: string;
  image_uris?: {
    small?: string;
    normal?: string;
    large?: string;
  };
  colors?: string[];
  cmc?: number;
}

export interface LegendaryCreature {
  id: string;
  name: string;
  mana_cost?: string;
  type_line?: string;
  colors?: string[];
  cmc?: number;
  image_uris?: {
    small?: string;
    normal?: string;
    large?: string;
  };
}

class MTGApiService {
  private baseUrl = 'https://api.scryfall.com';

  async searchCards(query: string): Promise<CardSearchResult[]> {
    if (!query || query.length < 2) return [];

    try {
      const response = await fetch(
        `${this.baseUrl}/cards/search?q=${encodeURIComponent(query)}&unique=cards&order=name`
      );
      
      if (!response.ok) {
        if (response.status === 404) {
          return []; // No cards found
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data?.slice(0, 10).map((card: ScryfallCard) => ({
        id: card.id,
        name: card.name,
        mana_cost: card.mana_cost,
        type_line: card.type_line,
        image_uris: card.image_uris,
        colors: card.colors,
        cmc: card.cmc,
      })) || [];
    } catch (error) {
      console.error('Error searching cards:', error);
      return [];
    }
  }

  async getCardByName(name: string): Promise<ScryfallCard | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/cards/named?exact=${encodeURIComponent(name)}`
      );
      
      if (!response.ok) {
        return null;
      }
console.log(await response.json());
      return await response.json();
    } catch (error) {
      console.error('Error fetching card:', error);
      return null;
    }
  }

  async getCardByFuzzyName(name: string): Promise<ScryfallCard | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/cards/named?fuzzy=${encodeURIComponent(name)}`
      );
      
      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching card:', error);
      return null;
    }
  }

  async getLegendaryCreatures(): Promise<LegendaryCreature[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/cards/search?q=is:legendary+t:creature&unique=cards&order=name`
      );
      
      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.data?.slice(0, 50).map((card: ScryfallCard) => ({
        id: card.id,
        name: card.name,
        mana_cost: card.mana_cost,
        type_line: card.type_line,
        colors: card.colors,
        cmc: card.cmc,
        image_uris: card.image_uris,
      })) || [];
    } catch (error) {
      console.error('Error fetching legendary creatures:', error);
      return [];
    }
  }

  async getCardSuggestions(partialName: string): Promise<CardSearchResult[]> {
    if (!partialName || partialName.length < 2) return [];

    try {
      const response = await fetch(
        `${this.baseUrl}/cards/autocomplete?q=${encodeURIComponent(partialName)}`
      );
      
      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const suggestions = data.data?.slice(0, 5) || [];
      
      // Fetch full card data for suggestions
      const cardPromises = suggestions.map((name: string) => 
        this.getCardByName(name).catch(() => null)
      );
      
      const cards = await Promise.all(cardPromises);
      return cards
        .filter((card): card is ScryfallCard => card !== null)
        .map(card => ({
          id: card.id,
          name: card.name,
          mana_cost: card.mana_cost,
          type_line: card.type_line,
          image_uris: card.image_uris,
          colors: card.colors,
          cmc: card.cmc,
        }));
    } catch (error) {
      console.error('Error getting card suggestions:', error);
      return [];
    }
  }

  isLegendaryCreature(card: ScryfallCard): boolean {
    return card.type_line?.includes('Legendary') && card.type_line?.includes('Creature') || false;
  }

  getManaSymbols(manaCost?: string): string[] {
    if (!manaCost) return [];
    
    // Extract mana symbols from mana cost string like "{1}{U}{B}"
    const symbolRegex = /\{([^}]+)\}/g;
    const symbols: string[] = [];
    let match;
    
    while ((match = symbolRegex.exec(manaCost)) !== null) {
      symbols.push(match[1]);
    }
    
    return symbols;
  }
}

export const mtgApi = new MTGApiService(); 