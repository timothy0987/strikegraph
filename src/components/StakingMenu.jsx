import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Coins } from 'lucide-react';
import X1Badge from './X1Badge';

const StakingMenu = () => {
  const { setStakeAmount, isPending, setGameState, poolBalance, maxStake } = useGame();
  const [amount, setAmount] = useState(0.5);

  const handleContinue = () => {
    const val = parseFloat(amount);
    if (Number.isNaN(val) || val < 0.5) {
      alert('Minimum stake is 0.5 X1T');
      return;
    }
    if (maxStake > 0 && val > maxStake) {
      alert(`Max stake right now is ${maxStake.toFixed(1)} X1T — the pool has to be able to pay 2×.`);
      return;
    }
    setStakeAmount(val);
    setGameState('aiming');
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-black/40 backdrop-blur-sm">
      <div className="glass-panel p-10 flex flex-col items-center gap-6 min-w-[400px] max-w-[92vw] border border-neonGreen/20 shadow-[0_0_30px_rgba(57,255,20,0.1)]">
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 rounded-full bg-neonGreen/10 border border-neonGreen/30 animate-pulse text-neonGreen">
            <Coins size={40} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-widest text-center">SET YOUR STAKE</h1>
          <p className="text-gray-400 text-sm text-center max-w-[300px]">
            You&apos;ll stake this on <span className="text-x1GreenBright font-bold">X1 EcoChain</span> when you pick a
            corner. Beat the keeper for a <span className="text-neonGreen font-bold">2x payout</span>.
          </p>
          <X1Badge />
        </div>

        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-col gap-2 w-full">
            <label className="text-xs text-gray-400 font-mono tracking-widest uppercase">
              Stake Amount ({maxStake > 0 ? `0.5 – ${maxStake.toFixed(1)}` : 'min 0.5'} X1T)
            </label>
            <input
              type="number"
              min="0.5"
              max={maxStake > 0 ? maxStake : undefined}
              step="0.5"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isPending}
              className="w-full bg-black/60 border border-white/10 hover:border-white/20 focus:border-neonGreen focus:outline-none text-white text-center font-bold text-xl py-3 rounded-lg tracking-wider shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] transition-colors"
            />
            {poolBalance > 0 && (
              <span className="text-[10px] text-gray-500 font-mono text-center">
                payout pool: {poolBalance.toFixed(1)} X1T · win pays 2× your stake
              </span>
            )}
          </div>

          <div className="bg-black/50 border border-green-500/30 rounded-lg p-3 mb-2 text-sm text-gray-300">
            <h4 className="text-green-400 font-bold mb-2">HOW IT WORKS</h4>
            <ol className="list-decimal list-inside space-y-1.5 font-mono text-xs leading-relaxed text-gray-300">
              <li>Pick a corner — your choice is hashed and committed on-chain (hidden).</li>
              <li>The keeper&apos;s dive is sealed by the next block hash — nobody can pick it.</li>
              <li>Reveal. The contract settles GOAL / SAVED itself and pays out.</li>
            </ol>
          </div>

          <button
            disabled={isPending}
            onClick={handleContinue}
            className="btn-neon w-full py-4 text-xl flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] disabled:opacity-50 mt-2"
          >
            TO THE SPOT
          </button>

          <button
            disabled={isPending}
            onClick={() => setGameState('menu')}
            className="mt-2 text-gray-400 hover:text-white transition-colors text-center text-sm disabled:opacity-50"
          >
            CANCEL &amp; GO BACK
          </button>
        </div>
      </div>
    </div>
  );
};

export default StakingMenu;
