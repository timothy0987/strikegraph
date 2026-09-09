import React from 'react';
import { useGame } from '../context/GameContext';
import { Share2, ArrowRight, ShieldCheck, ExternalLink } from 'lucide-react';

const EXPLORER_TX = 'https://maculatus-scan.x1eco.com/tx/';
const ZONE_LABEL = ['bottom-left', 'bottom-centre', 'bottom-right', 'top-left', 'top-centre', 'top-right'];

const GameUI = () => {
  const { gameState, setGameState, result, chainResult, setChainResult, triggerReset } = useGame();

  const getTwitterShareUrl = () => {
    const gameUrl = 'https://playgolazo.xyz';
    let text = '';
    let hashtags = '';
    if (result === 'GOAL') {
      text = 'GOLAZO! 🚀 Buried one past the keeper and doubled my stake — outcome settled on-chain via commit/reveal on X1 EcoChain. Beat my score: ';
      hashtags = 'Golazo,X1EcoChain,PlayToEarn';
    } else {
      text = 'The keeper read my commit/reveal penalty on X1 EcoChain... 🧤 Need a higher-tier player NFT for round two: ';
      hashtags = 'Golazo,X1EcoChain,PlayToOwn';
    }
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(gameUrl)}&hashtags=${hashtags}`;
  };

  const continueGame = () => {
    triggerReset();
    setChainResult(null);
    setGameState('menu');
  };

  const gas = chainResult ? Number(chainResult.gasX1T) : 0;
  const payout = chainResult ? Number(chainResult.payout) : 0;

  return (
    <div className="w-full h-full pointer-events-none relative">
      {gameState === 'aiming' && (
        <div className="absolute bottom-10 left-0 right-0 flex justify-center">
          <div className="glass-panel px-8 py-3 text-white text-lg tracking-widest animate-pulse">
            PICK A CORNER — YOUR SHOT IS COMMITTED ON-CHAIN
          </div>
        </div>
      )}

      {gameState === 'result' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto px-4">
          <h1
            className={`text-8xl font-black mb-4 tracking-widest uppercase ${
              result === 'GOAL'
                ? 'text-neonGreen drop-shadow-[0_0_20px_rgba(57,255,20,0.8)] animate-bounce'
                : 'text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]'
            }`}
          >
            {result === 'GOAL' ? 'GOAL!' : 'SAVED'}
          </h1>

          {chainResult && (
            <div className="glass-panel px-6 py-4 mb-6 w-full max-w-[420px] flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2 text-neonGreen font-bold text-xs uppercase tracking-widest">
                <ShieldCheck size={14} /> Provably fair · settled on X1
              </div>
              <div className="flex justify-between text-gray-300">
                <span>You shot</span>
                <span className="font-mono text-white">{ZONE_LABEL[chainResult.shotZone]}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Keeper covered</span>
                <span className="font-mono text-white">
                  {[0, 1, 2, 3, 4, 5].filter((z) => chainResult.keeperMask & (1 << z)).length} corner
                  {[0, 1, 2, 3, 4, 5].filter((z) => chainResult.keeperMask & (1 << z)).length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Payout</span>
                <span className="font-mono text-neonGreen">{payout > 0 ? `+${payout} X1T` : '—'}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Gas (commit + reveal)</span>
                <span className="font-mono text-white">{gas < 0.0001 ? '<0.0001' : gas.toFixed(5)} X1T</span>
              </div>
              {chainResult.revealHash && (
                <a
                  href={`${EXPLORER_TX}${chainResult.revealHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-neonBlue hover:underline text-xs mt-1 pointer-events-auto"
                >
                  <ExternalLink size={12} /> view the reveal transaction
                </a>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <a
              href={getTwitterShareUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-premium flex items-center gap-2 px-6 py-3 font-bold text-sm bg-neonPink border-neonPink text-white hover:scale-105 transition-all shadow-[0_0_15px_rgba(255,16,240,0.3)] decoration-none pointer-events-auto"
            >
              <Share2 size={16} /> SHARE REPLAY
            </a>
            <button
              onClick={continueGame}
              className="btn-neon flex items-center gap-2 px-8 py-3 font-bold text-sm bg-neonGreen border-neonGreen text-black hover:scale-105 transition-all shadow-[0_0_15px_rgba(57,255,20,0.3)] pointer-events-auto"
            >
              CONTINUE <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameUI;
