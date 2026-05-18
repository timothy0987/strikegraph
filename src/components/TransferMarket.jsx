import React from 'react';
import { useGame } from '../context/GameContext';
import { ChevronLeft, Zap, Target } from 'lucide-react';

const TransferMarket = () => {
  const { setGameState, playerVariants, selectedPlayer, setSelectedPlayer } = useGame();

  const handleEquip = (variant) => {
    setSelectedPlayer(variant);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-black/80 backdrop-blur-md overflow-y-auto pt-24 pb-12">
      <div className="absolute top-8 left-8">
        <button 
          onClick={() => setGameState('menu')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft /> Back to Menu
        </button>
      </div>

      <div className="w-full max-w-5xl flex flex-col gap-8 px-6">
        <div className="text-center">
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neonPink to-neonBlue drop-shadow-[0_0_10px_rgba(255,16,240,0.5)] tracking-wider">TRANSFER MARKET</h2>
          <p className="text-gray-400 text-sm mt-2">Equip unique player variants to boost your stats</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
          {playerVariants.map((variant) => {
            const isEquipped = selectedPlayer.id === variant.id;
            return (
              <div key={variant.id} style={{ borderColor: variant.color, boxShadow: isEquipped ? `0 0 20px ${variant.color}80` : 'none' }} className={`p-6 rounded-xl border-2 flex flex-col items-center gap-4 bg-gray-900/60 backdrop-blur-sm relative overflow-hidden transition-all duration-300 hover:scale-105`}>
                <h3 style={{ color: variant.color }} className="text-2xl font-black uppercase tracking-wider">{variant.name}</h3>
                <div className="text-3xl font-black text-white my-2">
                  {variant.price === 0 ? 'FREE' : `${variant.price} ℏ`}
                </div>
                <div className="w-full space-y-3 mt-2">
                  <div className="flex justify-between items-center text-sm bg-black/40 px-3 py-2 rounded">
                    <span className="flex items-center gap-2 text-gray-400"><Zap size={16}/> Power</span>
                    <span style={{ color: variant.color }} className="font-bold text-lg">{variant.power.toFixed(1)}x</span>
                  </div>
                  <div className="flex justify-between items-center text-sm bg-black/40 px-3 py-2 rounded">
                    <span className="flex items-center gap-2 text-gray-400"><Target size={16}/> Accuracy</span>
                    <span style={{ color: variant.color }} className="font-bold text-lg">{variant.accuracy.toFixed(1)}x</span>
                  </div>
                </div>

                <div className="mt-auto pt-6 w-full">
                  {isEquipped ? (
                    <div style={{ color: variant.color, textShadow: `0 0 10px ${variant.color}` }} className="text-center font-bold tracking-widest py-2 border-2 border-transparent">
                      EQUIPPED
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleEquip(variant)}
                      style={{ backgroundColor: `${variant.color}20`, borderColor: variant.color, color: variant.color }}
                      className="w-full font-bold text-sm py-2 rounded-lg border hover:bg-opacity-40 transition-colors tracking-widest"
                    >
                      EQUIP
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TransferMarket;
