import React from 'react';
import { useGame } from '../context/GameContext';
import { Share2, ArrowRight } from 'lucide-react';

const GameUI = () => {
  const { gameState, result, resolveGameOnChain, triggerReset } = useGame();

  const getTwitterShareUrl = () => {
    const gameUrl = "https://strikegraph-ai.vercel.app";
    let text = "";
    let hashtags = "";
    
    if (result === 'GOAL') {
      text = "Just scored an absolute banger against the StrikeGraph AI! ⚽ Play the game and try to beat my high score on Hedera: ";
      hashtags = "StrikeGraph,Hedera,PlayToEarn";
    } else {
      text = "The StrikeGraph AI goalie just made an insane save against me... 🧤 I need that 1.8x Accuracy NFT for round two: ";
      hashtags = "StrikeGraph,Hedera,PlayToOwn";
    }
    
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(gameUrl)}&hashtags=${hashtags}`;
  };

  return (
    <div className="w-full h-full pointer-events-none relative">
      {gameState === 'aiming' && (
        <div className="absolute bottom-10 left-0 right-0 flex justify-center">
          <div className="glass-panel px-8 py-3 text-white text-lg tracking-widest animate-pulse">
            SELECT A TARGET ZONE TO KICK
          </div>
        </div>
      )}

      {gameState === 'result' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto">
          <h1 className={`text-8xl font-black mb-6 tracking-widest uppercase ${result === 'GOAL' ? 'text-neonGreen drop-shadow-[0_0_20px_rgba(57,255,20,0.8)] animate-bounce' : 'text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]'}`}>
            {result === 'GOAL' ? 'GOAL!' : 'SAVED'}
          </h1>
          
          <div className="flex gap-4 mt-6">
            <a 
              href={getTwitterShareUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-premium flex items-center gap-2 px-6 py-3 font-bold text-sm bg-neonPink border-neonPink text-white hover:scale-105 transition-all shadow-[0_0_15px_rgba(255,16,240,0.3)] decoration-none"
            >
              <Share2 size={16} /> SHARE REPLAY
            </a>
            
            <button 
              onClick={() => {
                triggerReset();
                resolveGameOnChain(result === 'GOAL');
              }}
              className="btn-neon flex items-center gap-2 px-8 py-3 font-bold text-sm bg-neonGreen border-neonGreen text-black hover:scale-105 transition-all shadow-[0_0_15px_rgba(57,255,20,0.3)]"
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
