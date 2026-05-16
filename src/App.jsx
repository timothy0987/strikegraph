import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import MainMenu from './components/MainMenu';
import TransferMarket from './components/TransferMarket';
import GameUI from './components/GameUI';
import ThreeGame from './components/ThreeGame';
import Leaderboard from './components/Leaderboard';
import TopNav from './components/TopNav';

const AppContent = () => {
  const { gameState } = useGame();

  return (
    <div className="relative w-screen h-screen pt-[72px]">
      <TopNav />
      {/* 3D Canvas Background layer */}
      {gameState !== 'leaderboard' && (
        <div className="absolute inset-0 z-0">
          <ThreeGame />
        </div>
      )}

      {/* HTML UI Overlay Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none mt-[72px]">
        <div className="pointer-events-auto h-full w-full">
          {gameState === 'menu' && <MainMenu />}
          {gameState === 'market' && <TransferMarket />}
          {gameState === 'leaderboard' && <Leaderboard />}
          {(gameState === 'aiming' || gameState === 'kicking' || gameState === 'result') && <GameUI />}
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

export default App;
