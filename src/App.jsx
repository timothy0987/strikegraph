import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import MainMenu from './components/MainMenu';
import StakingMenu from './components/StakingMenu';
import TransferMarket from './components/TransferMarket';
import GameUI from './components/GameUI';
import GameScene from './components/GameScene';
import Leaderboard from './components/Leaderboard';
import TopNav from './components/TopNav';
import AdminPanel from './components/AdminPanel';

const AppContent = () => {
  const { gameState, isPending, pendingMessage } = useGame();

  return (
    <div className="relative w-screen h-screen pt-[72px]">
      <TopNav />
      {/* 3D Canvas Background layer */}
      {gameState !== 'leaderboard' && (
        <div className="absolute inset-0 z-0">
          <GameScene />
        </div>
      )}

      {/* HTML UI Overlay Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none mt-[72px]">
        <div className="pointer-events-auto h-full w-full">
          {gameState === 'menu' && <MainMenu />}
          {gameState === 'staking' && <StakingMenu />}
          {gameState === 'market' && <TransferMarket />}
          {gameState === 'leaderboard' && <Leaderboard />}
          {gameState === 'admin' && <AdminPanel />}
          {(gameState === 'aiming' || gameState === 'kicking' || gameState === 'result') && <GameUI />}
        </div>
      </div>

      {/* Global Transaction Loading Overlay */}
      {isPending && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto">
          <div className="flex flex-col items-center gap-6 p-8 rounded-2xl border border-neonGreen/20 bg-black/60 shadow-[0_0_50px_rgba(57,255,20,0.15)] max-w-md text-center">
            {/* Spinning Loader */}
            <div className="w-16 h-16 border-4 border-t-neonGreen border-neonGreen/20 rounded-full animate-spin"></div>
            <h2 className="text-2xl font-bold text-white tracking-wider">Transaction Pending</h2>
            <p className="text-gray-400 font-mono text-sm">{pendingMessage}</p>
          </div>
        </div>
      )}
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
