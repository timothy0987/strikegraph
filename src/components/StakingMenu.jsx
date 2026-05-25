import React from 'react';
import { useGame } from '../context/GameContext';
import { Coins } from 'lucide-react';

const StakingMenu = () => {
  const { stakeOnChain, isPending, setGameState } = useGame();

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-black/40 backdrop-blur-sm">
      <div className="glass-panel p-10 flex flex-col items-center gap-8 min-w-[400px] border border-neonGreen/20 shadow-[0_0_30px_rgba(57,255,20,0.1)]">
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 rounded-full bg-neonGreen/10 border border-neonGreen/30 animate-pulse text-neonGreen">
            <Coins size={40} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-widest text-center">
            GAME STAKING
          </h1>
          <p className="text-gray-400 text-sm text-center max-w-[280px]">
            Stake HBAR to enter the match. Score a goal to receive a <span className="text-neonGreen font-bold">2x payout</span>!
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full">
          <button 
            disabled={isPending}
            onClick={() => stakeOnChain(5)} 
            className="btn-neon w-full py-4 text-xl flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] disabled:opacity-50"
          >
            STAKE 5 HBAR
          </button>
          <button 
            disabled={isPending}
            onClick={() => stakeOnChain(50)} 
            className="btn-neon w-full py-4 text-xl flex items-center justify-center gap-2 border-neonBlue hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] disabled:opacity-50"
            style={{ 
              borderColor: '#00FFFF', 
              boxShadow: '0 0 10px rgba(0,255,255,0.2)',
              textShadow: '0 0 5px #00FFFF'
            }}
          >
            STAKE 50 HBAR
          </button>
          
          <button 
            disabled={isPending}
            onClick={() => setGameState('menu')} 
            className="mt-2 text-gray-400 hover:text-white transition-colors text-center text-sm disabled:opacity-50"
          >
            CANCEL & GO BACK
          </button>
        </div>
      </div>
    </div>
  );
};

export default StakingMenu;
