import React from 'react';
import { useGame } from '../context/GameContext';
import { useXP } from '../hooks/useXP';
import { useHederaNativeId } from '../hooks/useHederaNativeId';
import { ChevronLeft, Trophy, User } from 'lucide-react';

const MOCK_LEADERBOARD = [
  { address: '0x123...456', nativeId: '0.0.8821', xp: 2500 },
  { address: '0xabc...def', nativeId: '0.0.9912', xp: 1800 },
  { address: '0x789...012', nativeId: '0.0.1234', xp: 1550 },
  { address: '0xdef...567', nativeId: '0.0.4432', xp: 1200 },
  { address: '0x321...654', nativeId: '0.0.2211', xp: 950 },
];

const Leaderboard = () => {
  const { setGameState, walletAddress } = useGame();
  const { xp } = useXP();
  const { nativeId } = useHederaNativeId(walletAddress);

  const currentUser = {
    address: walletAddress || 'Not Connected',
    nativeId: nativeId || (walletAddress ? '0.0....' : 'Not Connected'),
    xp: xp,
    isCurrentUser: true
  };

  const fullLeaderboard = [...MOCK_LEADERBOARD, currentUser]
    .sort((a, b) => b.xp - a.xp);

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
          <h2 className="text-3xl font-black text-neonGreen flex items-center justify-center gap-3 drop-shadow-[0_0_10px_rgba(57,255,20,0.5)]">
            <Trophy /> HALL OF FAME
          </h2>
          <p className="text-gray-400 text-sm mt-2">Top Penalty Kickers on Hedera Testnet</p>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {fullLeaderboard.map((player, index) => (
            <div 
              key={index}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                player.isCurrentUser 
                  ? 'border-neonPink bg-neonPink/10 shadow-[0_0_15px_rgba(255,16,240,0.2)]' 
                  : 'border-white/10 bg-gray-900/40'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`w-8 font-black text-xl ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-400' : 'text-gray-600'}`}>
                  #{index + 1}
                </span>
                <div className="flex flex-col">
                  <span className={`font-bold ${player.isCurrentUser ? 'text-neonPink' : 'text-white'}`}>
                    {player.nativeId}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">{player.address}</span>
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <span className="text-xl font-black text-neonGreen">{player.xp}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">XP POINTS</span>
              </div>
            </div>
          ))}
        </div>
        
        {!walletAddress && (
          <div className="text-center text-xs text-gray-500 mt-2">
            Connect your wallet to see your rank!
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
