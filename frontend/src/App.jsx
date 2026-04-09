import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import LandingPage from './pages/LandingPage';
import FactionSelectPage from './pages/FactionSelectPage';
import ArenaPage from './pages/ArenaPage';
import ChatPage from './pages/ChatPage';
import TribunalPage from './pages/TribunalPage';
import RulebookPage from './pages/RulebookPage';
import Notifications from './components/Notifications';

function AppContent() {
  const { page } = useGame();

  return (
    <div className="app">
      <Notifications />
      {page === 'landing' && <LandingPage />}
      {page === 'select' && <FactionSelectPage />}
      {page === 'arena' && <ArenaPage />}
      {page === 'chat' && <ChatPage />}
      {page === 'tribunal' && <TribunalPage />}
      {page === 'rulebook' && <RulebookPage />}
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}
