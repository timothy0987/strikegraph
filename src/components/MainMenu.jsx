import React from 'react';
import { useGame } from '../context/GameContext';
import { Coins } from 'lucide-react';

const MainMenu = () => {
  const { setGameState, selectedPlayer, walletConnected, activeStake } = useGame();

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-black/40 backdrop-blur-sm">
      
      {/* Top Bar removed, moved to TopNav */}

      <div className="glass-panel p-10 flex flex-col items-center gap-8 min-w-[400px]">
        {/* Title moved to TopNav */}
        
        <div className="text-gray-400 flex flex-col items-center gap-2">
          <span>Current Kicker: <span style={{ color: selectedPlayer?.color }} className="font-bold">{selectedPlayer?.name}</span></span>
          <div className="flex gap-4 text-sm">
            <span>PWR: {selectedPlayer?.power}x</span>
            <span>ACC: {selectedPlayer?.accuracy}x</span>
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full">
          <button 
            onClick={() => {
              if (!walletConnected) {
                alert("Please connect your wallet first!");
                return;
              }
              if (activeStake > 0n) {
                // If there is an active stake on-chain, bypass staking and resume game immediately
                setGameState('aiming');
              } else {
                setGameState('staking');
              }
            }} 
            className="btn-neon w-full py-4 text-xl"
          >
            {activeStake > 0n ? 'RESUME GAME' : 'PLAY NOW'}
          </button>
          <button 
            onClick={() => setGameState('market')} 
            className="glass-panel py-3 text-gray-300 hover:text-white transition-colors border border-white/10 hover:border-white/30"
          >
            TRANSFER MARKET
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
