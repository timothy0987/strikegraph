import React, { useEffect, useState } from 'react';
import { ShieldCheck, Hexagon, Zap, ArrowRight, ExternalLink } from 'lucide-react';
import { useGame } from '../context/GameContext';
import X1Badge from './X1Badge';
import { GOLAZO_ARENA_ADDRESS } from '../config/contract';

const EXPLORER = 'https://maculatus-scan.x1eco.com';
const SHOT_RESOLVED_TOPIC = '0xf01431bfe0148086eba32c9b4b9d973149cc2485eedd599ce52a83bfccf26db7';

const PROPS = [
  {
    icon: ShieldCheck,
    title: 'Provably fair',
    body: 'You commit a hashed shot; the keeper’s dive comes from a future block hash. The contract settles it — no server, no oracle.',
  },
  {
    icon: Hexagon,
    title: 'Real player NFTs',
    body: 'Each variant is an ERC-721 with on-chain art. Higher tiers make the keeper cover fewer corners.',
  },
  {
    icon: Zap,
    title: '~$0.0001 a match',
    body: 'Commit + reveal costs a fraction of a cent on X1 EcoChain, and settles in seconds.',
  },
];

const MainMenu = () => {
  const { setGameState, selectedPlayer, walletConnected, hasOpenCommit, resumePenalty, isPending } = useGame();
  const [settled, setSettled] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch(
      `${EXPLORER}/api?module=logs&action=getLogs&fromBlock=0&toBlock=latest&address=${GOLAZO_ARENA_ADDRESS}&topic0=${SHOT_RESOLVED_TOPIC}`,
    )
      .then((r) => r.json())
      .then((j) => {
        if (alive && Array.isArray(j.result)) setSettled(j.result.length);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const play = () => {
    if (!walletConnected) {
      alert('Please connect your wallet first!');
      return;
    }
    setGameState('staking');
  };

  return (
    <div className="absolute inset-0 overflow-y-auto bg-gradient-to-b from-black/85 via-black/25 to-black/90">
      <div className="min-h-full flex flex-col items-center justify-center px-4 py-14">
        <div className="w-full max-w-3xl flex flex-col items-center text-center gap-7">
          {/* Hero */}
          <div className="flex flex-col items-center gap-4">
            <h1 className="font-arcade font-black tracking-tight leading-none text-white text-6xl sm:text-7xl drop-shadow-[0_0_25px_rgba(57,255,20,0.35)]">
              Gol<span className="text-neonGreen">azo</span>
            </h1>
            <p className="text-gray-200 text-lg sm:text-xl max-w-xl">
              The provably-fair penalty shootout — every goal and save settled on-chain, on{' '}
              <span className="text-x1GreenBright font-semibold">X1 EcoChain</span>.
            </p>
            <X1Badge />
          </div>

          {/* Value props */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            {PROPS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="glass-panel p-4 flex flex-col items-center gap-2 text-center">
                <Icon size={22} className="text-neonGreen" />
                <span className="font-bold text-white text-sm uppercase tracking-wider">{title}</span>
                <span className="text-gray-400 text-xs leading-relaxed">{body}</span>
              </div>
            ))}
          </div>

          {hasOpenCommit && (
            <button
              onClick={resumePenalty}
              disabled={isPending}
              className="btn-premium w-full max-w-sm py-3 text-sm disabled:opacity-50"
            >
              {isPending ? 'REVEALING…' : 'RESUME — REVEAL YOUR COMMITTED SHOT'}
            </button>
          )}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
            <button
              onClick={play}
              disabled={isPending}
              className="btn-neon flex-1 w-full py-4 text-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              PLAY NOW <ArrowRight size={20} />
            </button>
            <button
              onClick={() => setGameState('market')}
              className="glass-panel flex-1 w-full py-4 text-gray-200 hover:text-white transition-colors uppercase tracking-wider font-bold text-sm border border-white/15 hover:border-white/40"
            >
              Transfer Market
            </button>
          </div>

          {/* Trust row */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-mono text-gray-500 uppercase tracking-widest">
            <a
              href={`${EXPLORER}/address/${GOLAZO_ARENA_ADDRESS}#code`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-neonGreen transition-colors"
            >
              <ExternalLink size={11} /> Contract verified
            </a>
            {settled != null && (
              <span className="text-gray-400">
                <span className="text-neonGreen font-bold">{settled}</span> matches settled on-chain
              </span>
            )}
            <span>
              Kicker: <span style={{ color: selectedPlayer?.color }}>{selectedPlayer?.name}</span> · PWR{' '}
              {selectedPlayer?.power}× · ACC {selectedPlayer?.accuracy}×
            </span>
          </div>

          {import.meta.env.DEV && (
            <button
              onClick={() => setGameState('staking')}
              className="text-[11px] text-red-500/70 hover:text-red-400 underline font-mono"
            >
              [DEV] skip to staking
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
