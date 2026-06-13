import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Coins } from 'lucide-react';

const StakingMenu = () => {
  const { stakeOnChain, isPending, setGameState } = useGame();
  const [stakeAmount, setStakeAmount] = useState(5);

  const handleStakeClick = () => {
    const val = parseFloat(stakeAmount);
    if (isNaN(val) || val < 5) {
      alert("Minimum stake is 5 HBAR");
      return;
    }
    stakeOnChain(val);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-black/40 backdrop-blur-sm">
      <div className="glass-panel p-10 flex flex-col items-center gap-6 min-w-[400px] border border-neonGreen/20 shadow-[0_0_30px_rgba(57,255,20,0.1)]">
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
          {/* Numeric Input */}
          <div className="flex flex-col gap-2 w-full">
            <label className="text-xs text-gray-400 font-mono tracking-widest uppercase">
              Stake Amount (Min 5 HBAR)
            </label>
            <input 
              type="number"
              min="5"
              step="any"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              disabled={isPending}
              className="w-full bg-black/60 border border-white/10 hover:border-white/20 focus:border-neonGreen focus:outline-none text-white text-center font-bold text-xl py-3 rounded-lg tracking-wider shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] transition-colors"
            />
          </div>

          {/* Gameplay Instructions */}
          <div className="bg-black/50 border border-green-500/30 rounded-lg p-3 mb-4 text-sm text-gray-300">
            <h4 className="text-green-400 font-bold mb-2">HOW TO PLAY</h4>
            <ol className="list-decimal list-inside space-y-1.5 font-mono text-xs leading-relaxed text-gray-300">
              <li>Stake your Testnet HBAR to enter the pitch.</li>
              <li>Tap or click 'SHOOT' and aim your shot.</li>
              <li>Beat the AI Keeper to earn a 2x payout and XP!</li>
            </ol>
          </div>

          <button 
            disabled={isPending}
            onClick={handleStakeClick} 
            className="btn-neon w-full py-4 text-xl flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] disabled:opacity-50 mt-2"
          >
            STAKE HBAR
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
