import React from 'react';
import './App.css';
import DeckList from './components/DeckList';
import DeckSimulate from './components/DeckSimulate';
import DeckUpload from './components/DeckUpload';
import { DeckProvider } from './contexts/DeckProvider';
import type { Deck } from './types/deck';

function App() {
  const [currentView, setCurrentView] = React.useState<'list' | 'simulate' | 'upload'>('list');
  const [selectedDeckId, setSelectedDeckId] = React.useState<number | null>(null);

  const handleDeckSelect = (deck: Deck) => {
    setSelectedDeckId(deck.id);
    setCurrentView('simulate');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedDeckId(null);
  };

  const handleUploadClick = () => {
    setCurrentView('upload');
  };

  const handleUploadBack = () => {
    setCurrentView('list');
  };

  const handleDeckCreated = () => {
    setCurrentView('list');
  };

  return (
    <DeckProvider>
      <div className="App">
      {currentView === 'list' && (
        <DeckList
            onSelectDeck={handleDeckSelect} 
            onNewDeck={handleUploadClick}
            onSimulateDeck={handleDeckSelect}
        />
      )}
        {currentView === 'simulate' && selectedDeckId && (
          <DeckSimulate 
            deckId={selectedDeckId} 
          onBack={handleBackToList}
        />
      )}
        {currentView === 'upload' && (
          <DeckUpload onBack={handleUploadBack} onDeckCreated={handleDeckCreated} />
      )}
    </div>
    </DeckProvider>
  );
}

export default App;