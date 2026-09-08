import React from 'react';
import { useGame } from '../context/GameContext';
import X1Badge from './X1Badge';

const MainMenu = () => {
  const { setGameState, selectedPlayer, walletConnected, hasOpenCommit, resumePenalty, isPending } = useGame();

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-black/40 backdrop-blur-sm">
      <div className="glass-panel p-10 flex flex-col items-center gap-8 min-w-[400px] max-w-[92vw]">
        <X1Badge />

        <div className="text-gray-400 flex flex-col items-center gap-2">
          <span>
            Current Kicker:{' '}
            <span style={{ color: selectedPlayer?.color }} className="font-bold">
              {selectedPlayer?.name}
            </span>
          </span>
          <div className="flex gap-4 text-sm">
            <span>PWR: {selectedPlayer?.power}x</span>
            <span>ACC: {selectedPlayer?.accuracy}x</span>
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full">
          <div className="bg-black/50 border border-green-500/30 rounded-lg p-3 mb-2 text-sm text-gray-300">
            <h4 className="text-green-400 font-bold mb-2">HOW TO PLAY</h4>
            <ol className="list-decimal list-inside space-y-1.5 font-mono text-xs leading-relaxed text-gray-300">
              <li>Set a stake and step up to the spot.</li>
              <li>Pick a corner — it&apos;s committed on-chain, hidden.</li>
              <li>Reveal: the contract settles GOAL / SAVED and pays 2x on a goal.</li>
            </ol>
          </div>

          {hasOpenCommit && (
            <button
              onClick={resumePenalty}
              disabled={isPending}
              className="btn-premium w-full py-3 text-sm bg-neonPink border-neonPink text-white disabled:opacity-50"
            >
              {isPending ? 'REVEALING…' : 'RESUME — REVEAL YOUR COMMITTED SHOT'}
            </button>
          )}

          <button
            onClick={() => {
              if (!walletConnected) {
                alert('Please connect your wallet first!');
                return;
              }
              setGameState('staking');
            }}
            disabled={isPending}
            className="btn-neon w-full py-4 text-xl disabled:opacity-50"
          >
            PLAY NOW
          </button>
          <button
            onClick={() => setGameState('market')}
            className="glass-panel py-3 text-gray-300 hover:text-white transition-colors border border-white/10 hover:border-white/30"
          >
            TRANSFER MARKET
          </button>

          {import.meta.env.DEV && (
            <button
              onClick={() => setGameState('staking')}
              className="text-xs text-red-500 hover:text-red-400 mt-2 text-center underline font-mono cursor-pointer"
              id="dev-bypass-btn"
            >
              [DEV] Go to staking
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
