import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { Trophy } from 'lucide-react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';

const Leaderboard = () => {
  const { walletAddress } = useGame();
  const [xpData, setXpData] = useState([]);

  // Fetch Real-time XP from Firebase
  useEffect(() => {
    const leaderboardRef = ref(db, 'leaderboard');
    const unsubscribe = onValue(leaderboardRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formattedData = Object.entries(data).map(([id, xpValue]) => {
          const displayId = id.replace(/_/g, '.');
          return {
            nativeId: displayId,
            xp: xpValue,
            isCurrentUser: walletAddress && displayId.toLowerCase() === walletAddress.toLowerCase()
          };
        }).sort((a, b) => b.xp - a.xp);
        setXpData(formattedData);
      }
    });

    return () => unsubscribe();
  }, [walletAddress]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-black/60 backdrop-blur-md">
      <div className="glass-panel p-8 w-[600px] flex flex-col gap-6">
        
        {/* Title */}
        <div className="text-center">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neonGreen to-neonBlue flex items-center justify-center gap-3 drop-shadow-[0_0_10px_rgba(57,255,20,0.5)]">
            <Trophy /> HALL OF FAME
          </h2>
          <p className="text-gray-400 text-sm mt-2 font-mono uppercase tracking-wider">Global Leaderboard Rankings</p>
        </div>

        {/* Rankings List */}
        <div className="mt-2 flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
          {xpData.length > 0 ? (
            xpData.map((player, index) => (
              <div 
                key={index}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  player.isCurrentUser 
                    ? 'border-neonPink bg-neonPink/10 shadow-[0_0_15px_rgba(255,16,240,0.2)]' 
                    : 'border-white/10 bg-gray-900/40'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`w-8 font-black text-xl ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-400' : 'text-gray-600'}`}>
                    #{index + 1}
                  </span>
                  <div className="flex flex-col">
                    <span className={`font-bold ${player.isCurrentUser ? 'text-neonPink' : 'text-white'}`}>
                      {player.nativeId}
                    </span>
                    {player.isCurrentUser && <span className="text-[10px] text-neonPink uppercase font-black tracking-widest mt-0.5">You</span>}
                  </div>
                </div>
                
                <div className="flex flex-col items-end">
                  <span className="text-xl font-black text-neonGreen">{player.xp}</span>
                  <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">XP</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 px-6 text-gray-400 font-mono text-sm border border-dashed border-white/10 rounded-lg bg-black/20">
              No XP records found. Connect your wallet and play a match to earn XP and rank on the global leaderboard!
            </div>
          )}
        </div>
        
        {!walletAddress && (
          <div className="text-center text-[10px] text-gray-500 mt-2 border-t border-white/5 pt-4 font-mono uppercase tracking-wider">
            Connect your wallet to sync your progress!
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
