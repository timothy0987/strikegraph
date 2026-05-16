import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { useXP } from '../hooks/useXP';
import { useHederaNativeId } from '../hooks/useHederaNativeId';
import { ChevronLeft, Trophy } from 'lucide-react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';

const Leaderboard = () => {
  const { setGameState, walletAddress } = useGame();
  const { nativeId } = useHederaNativeId(walletAddress);
  const [leaderboardData, setLeaderboardData] = useState([]);

  useEffect(() => {
    const leaderboardRef = ref(db, 'leaderboard');
    const unsubscribe = onValue(leaderboardRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formattedData = Object.entries(data).map(([id, xpValue]) => ({
          nativeId: id,
          xp: xpValue,
          isCurrentUser: id === nativeId
        })).sort((a, b) => b.xp - a.xp);
        
        setLeaderboardData(formattedData);
      }
    });

    return () => unsubscribe();
  }, [nativeId]);

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
          <p className="text-gray-400 text-sm mt-2">Global Real-time Leaderboard</p>
        </div>

        <div className="mt-4 flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {leaderboardData.length > 0 ? (
            leaderboardData.map((player, index) => (
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
                    {player.isCurrentUser && <span className="text-[10px] text-neonPink uppercase">You</span>}
                  </div>
                </div>
                
                <div className="flex flex-col items-end">
                  <span className="text-xl font-black text-neonGreen">{player.xp}</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest">XP</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-500 italic">
              No data yet. Start playing to be the first!
            </div>
          )}
        </div>
        
        {!walletAddress && (
          <div className="text-center text-xs text-gray-500 mt-2 border-t border-white/5 pt-4">
            Connect your wallet to sync your progress!
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
