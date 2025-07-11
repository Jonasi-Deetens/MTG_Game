import type { Deck, DeckFormData, CardSearchResult, Card } from '../types/deck';

const API_BASE_URL = 'http://localhost:5001/api';

// New interface for optimized deck creation
interface OptimizedDeckData {
  name: string;
  description: string;
  commander_id?: string;
  cards: Card[]; // Full card data instead of just names
}

export const api = {
  // Get all decks
  async getDecks(): Promise<Deck[]> {
    const response = await fetch(`${API_BASE_URL}/decks`);
    if (!response.ok) {
      throw new Error('Failed to fetch decks');
    }
    return response.json();
  },

  // Get a specific deck
  async getDeck(id: number): Promise<Deck> {
    const response = await fetch(`${API_BASE_URL}/decks/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch deck');
    }
    return response.json();
  },

  // Create a new deck (legacy method for backward compatibility)
  async createDeck(deckData: DeckFormData): Promise<Deck> {
    console.log('Creating deck with data:', deckData);
    
    try {
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`${API_BASE_URL}/decks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deckData),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to create deck: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Deck created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error in createDeck:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  },

  // Create a new deck with optimized data (full card information)
  async createOptimizedDeck(deckData: OptimizedDeckData): Promise<Deck> {
    console.log('Creating optimized deck with data:', deckData);
    
    try {
      const response = await fetch(`${API_BASE_URL}/decks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deckData),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to create deck: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Deck created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error in createOptimizedDeck:', error);
      throw error;
    }
  },

  // Update a deck
  async updateDeck(id: number, updates: Partial<DeckFormData>): Promise<Deck> {
    const response = await fetch(`${API_BASE_URL}/decks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error('Failed to update deck');
    }
    return response.json();
  },

  // Delete a deck
  async deleteDeck(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/decks/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete deck');
    }
  },

  // Search for cards
  async searchCards(query: string): Promise<CardSearchResult[]> {
    if (query.length < 2) return [];
    
    const response = await fetch(`${API_BASE_URL}/cards/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Failed to search cards');
    }
    return response.json();
  },

  // Get all cards with filtering and pagination
  async getCards(params: {
    page?: number;
    limit?: number;
    type?: string;
    name?: string;
    rarity?: string;
    colors?: string;
  } = {}): Promise<{
    cards: Card[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.type) queryParams.append('type', params.type);
    if (params.name) queryParams.append('name', params.name);
    if (params.rarity) queryParams.append('rarity', params.rarity);
    if (params.colors) queryParams.append('colors', params.colors);
    
    const response = await fetch(`${API_BASE_URL}/cards?${queryParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch cards');
    }
    return response.json();
  },

  // Get specific card by ID
  async getCard(cardId: string): Promise<Card> {
    const response = await fetch(`${API_BASE_URL}/cards/${cardId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch card');
    }
    return response.json();
  },
}; 