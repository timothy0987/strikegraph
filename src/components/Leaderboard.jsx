import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { Trophy } from 'lucide-react';
import { useHederaNativeId } from '../hooks/useHederaNativeId';
import { STRIKEGRAPH_STORE_ADDRESS } from '../config/contract';

const convertEvmToNativeId = (evmAddress) => {
  if (!evmAddress) return '';
  const clean = evmAddress.toLowerCase().replace('0x', '');
  if (clean.startsWith('000000000000000000000000')) {
    const hexPart = clean.slice(24);
    const id = parseInt(hexPart, 16);
    return `0.0.${id}`;
  }
  return evmAddress;
};

const truncateAddress = (addr) => {
  if (!addr) return '';
  if (addr.length <= 11) return addr;
  return `${addr.slice(0, 7)}...${addr.slice(-4)}`;
};

const Leaderboard = () => {
  const { walletAddress } = useGame();
  const { nativeId: currentUserNativeId } = useHederaNativeId(walletAddress);
  const [xpData, setXpData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(
          `https://testnet.mirrornode.hedera.com/api/v1/contracts/${STRIKEGRAPH_STORE_ADDRESS}/results?limit=100`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch contract results from Mirror Node');
        }
        const data = await response.json();
        
        const players = {};
        if (data.results && Array.isArray(data.results)) {
          data.results.forEach((tx) => {
            if (tx.error_message) return;
            const nativeId = convertEvmToNativeId(tx.from);
            if (!nativeId) return;

            if (!players[nativeId]) {
              players[nativeId] = 0;
            }

            const params = tx.function_parameters || '';
            if (params.startsWith('0x3a4b66f1')) {
              // stake
              players[nativeId] += 10;
            } else if (params.startsWith('0xbff8877f')) {
              // resolveGame
              const isWin = params.endsWith('1');
              players[nativeId] += isWin ? 20 : 5;
            } else if (params.startsWith('0x7a69dae1')) {
              // buyPlayerVariant
              players[nativeId] += 30;
            } else {
              players[nativeId] += 10;
            }
          });
        }

        const formattedData = Object.entries(players)
          .map(([nativeId, xpValue]) => {
            return {
              nativeId,
              xp: xpValue,
              isCurrentUser: currentUserNativeId && nativeId.toLowerCase() === currentUserNativeId.toLowerCase()
            };
          })
          .sort((a, b) => b.xp - a.xp);

        if (isMounted) {
          setXpData(formattedData);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentUserNativeId]);

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
          {loading && xpData.length === 0 ? (
            <div className="text-center py-12 px-6 text-gray-400 font-mono text-sm border border-dashed border-white/10 rounded-lg bg-black/20 animate-pulse">
              LOADING LEADERBOARD DATA...
            </div>
          ) : xpData.length > 0 ? (
            xpData.map((player, index) => (
              <div 
                key={index}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  player.isCurrentUser 
                    ? 'border-neonPink bg-neonPink/10 shadow-[0_0_15px_rgba(255,16,240,0.2)]' 
                    : 'border-white/10 bg-gray-900/40 hover:border-white/20 transition-all duration-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`w-8 font-black text-xl ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-400' : 'text-gray-600'}`}>
                    #{index + 1}
                  </span>
                  <div className="flex flex-col">
                    <span className={`font-mono font-bold ${player.isCurrentUser ? 'text-neonPink' : 'text-white'}`}>
                      {truncateAddress(player.nativeId)}
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
              {error ? `ERROR: ${error}` : 'No XP records found on the blockchain.'}
            </div>
          )}
        </div>

        {/* Global Statistics */}
        <div className="text-center mt-4 pt-4 border-t border-white/5">
          <p className="text-xs font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-neonGreen to-neonBlue drop-shadow-[0_0_8px_rgba(57,255,20,0.3)] uppercase">
            Total Active Strikers: {xpData.length}
          </p>
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
