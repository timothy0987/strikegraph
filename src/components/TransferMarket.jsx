import React, { useState } from 'react';
import { useGame, TREASURY_ADDRESS } from '../context/GameContext';
import { ChevronLeft, Zap, Target } from 'lucide-react';

const TransferMarket = () => {
  const { setGameState, currentKicker, premiumKicker, buyPremiumKicker, walletConnected, balance } = useGame();
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');

  const handlePurchase = () => {
    if (!walletConnected) {
      setError("Please connect your wallet first!");
      return;
    }
    
    setPurchasing(true);
    setTimeout(() => {
      const success = buyPremiumKicker();
      if (success) {
        setError('');
      } else {
        setError("Insufficient HBAR balance.");
      }
      setPurchasing(false);
    }, 1000); // Simulate network delay
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-black/60 backdrop-blur-md">
      
      <div className="absolute top-8 left-8">
        <button 
          onClick={() => setGameState('menu')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft /> Back to Menu
        </button>
      </div>

      <div className="glass-panel p-8 w-[600px] flex flex-col gap-6">
        <div className="text-center">
          <h2 className="text-3xl font-black text-neonPink drop-shadow-[0_0_10px_rgba(255,16,240,0.5)]">TRANSFER MARKET</h2>
          <p className="text-gray-400 text-sm mt-2">Treasury: {TREASURY_ADDRESS.slice(0,6)}...{TREASURY_ADDRESS.slice(-4)}</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-4">
          {/* Free Kicker Card */}
          <div className={`p-6 rounded-xl border-2 ${currentKicker.type === 'Free' ? 'border-neonGreen shadow-[0_0_15px_rgba(57,255,20,0.2)]' : 'border-gray-800'} flex flex-col items-center gap-4 bg-gray-900/50`}>
            <h3 className="text-xl font-bold text-neonGreen">FREE KICKER</h3>
            <div className="w-full space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-1 text-gray-400"><Zap size={14}/> Power</span>
                <span className="text-white">50</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-1 text-gray-400"><Target size={14}/> Accuracy</span>
                <span className="text-white">50</span>
              </div>
            </div>
            <div className="mt-auto pt-4 text-gray-500 font-bold">
              {currentKicker.type === 'Free' ? 'EQUIPPED' : 'OWNED'}
            </div>
          </div>

          {/* Premium Kicker Card */}
          <div className={`p-6 rounded-xl border-2 ${currentKicker.type === 'Premium' ? 'border-neonPink shadow-[0_0_15px_rgba(255,16,240,0.3)]' : 'border-gray-700 hover:border-neonPink/50 transition-colors'} flex flex-col items-center gap-4 bg-gray-900/50 relative overflow-hidden`}>
            
            <h3 className="text-xl font-bold text-neonPink">PREMIUM</h3>
            <div className="w-full space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-1 text-gray-400"><Zap size={14}/> Power</span>
                <span className="text-white text-neonPink font-bold">85</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-1 text-gray-400"><Target size={14}/> Accuracy</span>
                <span className="text-white text-neonPink font-bold">80</span>
              </div>
            </div>

            <div className="mt-auto pt-4 w-full">
              {currentKicker.type === 'Premium' ? (
                <div className="text-center text-neonPink font-bold">EQUIPPED</div>
              ) : (
                <button 
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="btn-premium w-full text-sm py-2 flex justify-center items-center gap-2"
                >
                  {purchasing ? 'CONFIRMING...' : 'BUY 500 ℏ'}
                </button>
              )}
            </div>
          </div>
        </div>

        {error && <div className="text-red-500 text-center text-sm font-bold bg-red-900/20 py-2 rounded">{error}</div>}

      </div>
    </div>
  );
};

export default TransferMarket;
