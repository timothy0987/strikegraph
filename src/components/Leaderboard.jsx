import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { Trophy } from 'lucide-react';
import { STRIKEGRAPH_STORE_ADDRESS } from '../config/contract';
import X1Badge from './X1Badge';

// X1 EcoChain (Maculatus testnet) block explorer — Blockscout, Etherscan-compatible REST API
const EXPLORER_API = 'https://maculatus-scan.x1eco.com/api';

// Function selectors for StrikeGraphStore (identical across EVM chains)
const SEL_STAKE = '0x3a4b66f1';        // stake()
const SEL_RESOLVE = '0xbff8877f';      // resolveGame(bool)
const SEL_BUY_VARIANT = '0x7a69dae1';  // buyPlayerVariant(uint256)

const CONTRACT_DEPLOYED = /^0x[0-9a-fA-F]{40}$/.test(STRIKEGRAPH_STORE_ADDRESS) &&
  STRIKEGRAPH_STORE_ADDRESS !== '0x0000000000000000000000000000000000000000';

const truncateAddress = (addr) => {
  if (!addr) return '';
  if (addr.length <= 11) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const Leaderboard = () => {
  const { walletAddress } = useGame();
  const currentAddress = walletAddress ? walletAddress.toLowerCase() : null;
  const [xpData, setXpData] = useState([]);
  const [loading, setLoading] = useState(CONTRACT_DEPLOYED);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!CONTRACT_DEPLOYED) return;

    let isMounted = true;

    const fetchLeaderboard = async () => {
      try {
        const url = `${EXPLORER_API}?module=account&action=txlist&address=${STRIKEGRAPH_STORE_ADDRESS}&sort=desc&page=1&offset=1000`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to reach the X1 EcoChain explorer');
        }
        const data = await response.json();

        // Blockscout returns status "0" / message "No transactions found" when the contract has no history yet
        const txs = Array.isArray(data.result) ? data.result : [];

        const players = {};
        txs.forEach((tx) => {
          if (tx.isError === '1' || tx.txreceipt_status === '0') return;
          const from = (tx.from || '').toLowerCase();
          if (!from) return;

          const selector = (tx.input || '').toLowerCase().slice(0, 10);

          // Only real gameplay actions earn XP — ignore deploy / fund / any other calls
          let gained = 0;
          if (selector === SEL_STAKE) {
            gained = 10;
          } else if (selector === SEL_RESOLVE) {
            const isWin = (tx.input || '').toLowerCase().slice(-1) === '1';
            gained = isWin ? 20 : 5;
          } else if (selector === SEL_BUY_VARIANT) {
            gained = 30;
          } else {
            return;
          }

          players[from] = (players[from] || 0) + gained;
        });

        const formattedData = Object.entries(players)
          .map(([address, xpValue]) => ({
            address,
            xp: xpValue,
            isCurrentUser: currentAddress && address === currentAddress,
          }))
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
    const interval = setInterval(fetchLeaderboard, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentAddress]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-black/60 backdrop-blur-md">
      <div className="glass-panel p-8 w-[600px] flex flex-col gap-6">

        {/* Title */}
        <div className="text-center">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neonGreen to-neonBlue flex items-center justify-center gap-3 drop-shadow-[0_0_10px_rgba(57,255,20,0.5)]">
            <Trophy /> HALL OF FAME
          </h2>
          <p className="text-gray-400 text-sm mt-2 font-mono uppercase tracking-wider">Global Leaderboard Rankings</p>
          <p className="text-[10px] text-gray-500 mt-1 font-mono uppercase tracking-wider">Aggregated live from the X1 EcoChain explorer</p>
        </div>

        {/* Rankings List */}
        <div className="mt-2 flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
          {!CONTRACT_DEPLOYED ? (
            <div className="text-center py-12 px-6 text-gray-400 font-mono text-sm border border-dashed border-white/10 rounded-lg bg-black/20">
              Store contract not deployed yet — rankings appear here once StrikeGraph is live on X1 EcoChain.
            </div>
          ) : loading && xpData.length === 0 ? (
            <div className="text-center py-12 px-6 text-gray-400 font-mono text-sm border border-dashed border-white/10 rounded-lg bg-black/20 animate-pulse">
              LOADING LEADERBOARD DATA...
            </div>
          ) : xpData.length > 0 ? (
            xpData.map((player, index) => (
              <div
                key={player.address}
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
                      {truncateAddress(player.address)}
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
              {error ? `ERROR: ${error}` : 'No XP records found on-chain yet.'}
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
          <div className="text-center text-[10px] text-gray-500 mt-2 font-mono uppercase tracking-wider">
            Connect your wallet to sync your progress!
          </div>
        )}

        <div className="flex justify-center pt-4 border-t border-white/5">
          <X1Badge />
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
