import { useState, useEffect } from 'react';
import type { Deck } from '../types/deck';
import { api } from '../services/api';

interface DeckListProps {
  onSelectDeck: (deck: Deck) => void;
  onNewDeck: () => void;
  onSimulateDeck: (deck: Deck) => void;
}

const DeckList = ({ onSelectDeck, onNewDeck, onSimulateDeck }: DeckListProps) => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    try {
      setLoading(true);
      const fetchedDecks = await api.getDecks();
      setDecks(fetchedDecks);
    } catch (err) {
      setError('Failed to load decks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDeck = async (deckId: number) => {
    if (!confirm('Are you sure you want to delete this deck?')) {
      return;
    }

    try {
      await api.deleteDeck(deckId);
      setDecks(decks.filter(deck => deck.id !== deckId));
    } catch (err) {
      setError('Failed to delete deck');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadDecks}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">MTG Deck Manager</h1>
        <button
          onClick={onNewDeck}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
        >
          Create New Deck
        </button>
      </div>

      {decks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">No decks yet</h2>
          <p className="text-gray-500 mb-6">Create your first MTG deck to get started!</p>
          <button
            onClick={onNewDeck}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Deck
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck) => (
            <div
              key={deck.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 truncate">
                    {deck.name}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onSimulateDeck(deck)}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      Simulate
                    </button>
                    <button
                      onClick={() => onSelectDeck(deck)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteDeck(deck.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {deck.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {deck.description}
                  </p>
                )}
                
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex justify-between">
                    <span>Unique Cards:</span>
                    <span className="font-medium">{deck.cards.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Cards:</span>
                    <span className="font-medium">
                      {deck.cards.reduce((sum, card) => sum + card.quantity, 0)}
                    </span>
                  </div>
                  {deck.commander_id && (
                    <div className="flex justify-between">
                      <span>Commander:</span>
                      <span className="font-medium text-green-600">
                        {deck.legendary_creatures.find(c => c.id === deck.commander_id)?.name || 'Unknown'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span className="font-medium">
                      {new Date(deck.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeckList; 