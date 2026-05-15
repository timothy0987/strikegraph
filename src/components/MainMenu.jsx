import React from 'react';
import { useGame } from '../context/GameContext';
import { Wallet, Coins } from 'lucide-react';

const MainMenu = () => {
  const { setGameState, walletConnected, connectWallet, balance, currentKicker } = useGame();

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-black/40 backdrop-blur-sm">
      
      {/* Top Bar for Wallet */}
      <div className="absolute top-4 right-4 flex gap-4">
        {!walletConnected ? (
          <button onClick={connectWallet} className="btn-neon flex items-center gap-2 text-sm px-4 py-2">
            <Wallet size={16} /> Connect Wallet
          </button>
        ) : (
          <div className="glass-panel px-4 py-2 flex items-center gap-3 text-neonGreen font-bold text-sm">
            <span>0xTimo...cdef</span>
            <span className="flex items-center gap-1 text-neonPink"><Coins size={16} /> {balance} HBAR</span>
          </div>
        )}
      </div>

      <div className="glass-panel p-10 flex flex-col items-center gap-8 min-w-[400px]">
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neonGreen to-neonBlue drop-shadow-[0_0_10px_rgba(57,255,20,0.5)]">
          WEB3 PENALTY
        </h1>
        
        <div className="text-gray-400 flex flex-col items-center gap-2">
          <span>Current Kicker: <span style={{ color: currentKicker.color }} className="font-bold">{currentKicker.type}</span></span>
          <div className="flex gap-4 text-sm">
            <span>PWR: {currentKicker.power}</span>
            <span>ACC: {currentKicker.accuracy}</span>
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full">
          <button 
            onClick={() => setGameState('aiming')} 
            className="btn-neon w-full py-4 text-xl"
          >
            PLAY NOW
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
