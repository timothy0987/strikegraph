import React from 'react';
import { useGame } from '../context/GameContext';

const GameUI = () => {
  const { gameState, setGameState, result } = useGame();

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
          <h1 className={`text-7xl font-black mb-8 ${result === 'GOAL' ? 'text-neonGreen drop-shadow-[0_0_20px_rgba(57,255,20,0.8)]' : 'text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]'}`}>
            {result === 'GOAL' ? 'GOAL!' : 'SAVED'}
          </h1>
          
          <button 
            onClick={() => setGameState('aiming')}
            className="btn-neon text-xl px-10 py-4"
          >
            PLAY AGAIN
          </button>
          <button 
            onClick={() => setGameState('menu')}
            className="mt-4 text-gray-400 hover:text-white transition-colors"
          >
            MAIN MENU
          </button>
        </div>
      )}
    </div>
  );
};

export default GameUI;
