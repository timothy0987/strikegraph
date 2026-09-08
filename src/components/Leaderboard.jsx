import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { Trophy } from 'lucide-react';
import { GOLAZO_ARENA_ADDRESS } from '../config/contract';
import X1Badge from './X1Badge';
import MatchRecord from './MatchRecord';

// X1 EcoChain (Maculatus testnet) — Blockscout, Etherscan-compatible REST API
const EXPLORER_API = 'https://maculatus-scan.x1eco.com/api';
// keccak256("ShotResolved(address,uint8,uint8,bool,uint256)")
const SHOT_RESOLVED_TOPIC = '0xf01431bfe0148086eba32c9b4b9d973149cc2485eedd599ce52a83bfccf26db7';
// keccak256("VariantMinted(address,uint256,uint8,uint256)")
const VARIANT_MINTED_TOPIC = '0xbee6f0fba7136df56c2d7b6f89ec760c4fbd27af02a8dd1ea29edfc0ac6b4aab';

const CONTRACT_DEPLOYED =
  /^0x[0-9a-fA-F]{40}$/.test(GOLAZO_ARENA_ADDRESS) &&
  GOLAZO_ARENA_ADDRESS !== '0x0000000000000000000000000000000000000000';

const topicToAddress = (t) => (t ? `0x${t.slice(26)}`.toLowerCase() : '');
const truncate = (a) => (a && a.length > 11 ? `${a.slice(0, 6)}...${a.slice(-4)}` : a || '');

const Leaderboard = () => {
  const { walletAddress } = useGame();
  const currentAddress = walletAddress ? walletAddress.toLowerCase() : null;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(CONTRACT_DEPLOYED);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!CONTRACT_DEPLOYED) return;
    let alive = true;

    const getLogs = async (topic0) => {
      const url = `${EXPLORER_API}?module=logs&action=getLogs&fromBlock=0&toBlock=latest&address=${GOLAZO_ARENA_ADDRESS}&topic0=${topic0}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error('Failed to reach the X1 EcoChain explorer');
      const j = await r.json();
      return Array.isArray(j.result) ? j.result : [];
    };

    const load = async () => {
      try {
        const [shots, mints] = await Promise.all([getLogs(SHOT_RESOLVED_TOPIC), getLogs(VARIANT_MINTED_TOPIC)]);
        const xp = {};

        shots.forEach((log) => {
          const player = topicToAddress(log.topics?.[1]);
          if (!player) return;
          // data = shotZone(32) | keeperMask(32) | goal(32) | payout(32)
          const data = (log.data || '').replace(/^0x/, '');
          const goal = parseInt(data.slice(128, 192) || '0', 16) === 1;
          xp[player] = (xp[player] || 0) + 10 + (goal ? 20 : 5);
        });
        mints.forEach((log) => {
          const player = topicToAddress(log.topics?.[1]);
          if (!player) return;
          xp[player] = (xp[player] || 0) + 25;
        });

        const data = Object.entries(xp)
          .map(([address, value]) => ({
            address,
            xp: value,
            isCurrentUser: currentAddress && address === currentAddress,
          }))
          .sort((a, b) => b.xp - a.xp);

        if (alive) {
          setRows(data);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        if (alive) setError(err.message);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    const id = setInterval(load, 12000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [currentAddress]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-black/60 backdrop-blur-md overflow-y-auto py-8">
      <div className="glass-panel p-8 w-[600px] max-w-[92vw] flex flex-col gap-6">
        <div className="text-center">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neonGreen to-neonBlue flex items-center justify-center gap-3 drop-shadow-[0_0_10px_rgba(57,255,20,0.5)]">
            <Trophy /> HALL OF FAME
          </h2>
          <p className="text-gray-400 text-sm mt-2 font-mono uppercase tracking-wider">Global Leaderboard Rankings</p>
          <p className="text-[10px] text-gray-500 mt-1 font-mono uppercase tracking-wider">
            Aggregated live from ShotResolved events on X1 EcoChain
          </p>
        </div>

        {currentAddress && <MatchRecord address={currentAddress} />}

        <div className="mt-2 flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {!CONTRACT_DEPLOYED ? (
            <div className="text-center py-12 px-6 text-gray-400 font-mono text-sm border border-dashed border-white/10 rounded-lg bg-black/20">
              Arena contract not deployed yet.
            </div>
          ) : loading && rows.length === 0 ? (
            <div className="text-center py-12 px-6 text-gray-400 font-mono text-sm border border-dashed border-white/10 rounded-lg bg-black/20 animate-pulse">
              LOADING LEADERBOARD DATA...
            </div>
          ) : rows.length > 0 ? (
            rows.map((player, index) => (
              <div
                key={player.address}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  player.isCurrentUser
                    ? 'border-neonPink bg-neonPink/10 shadow-[0_0_15px_rgba(255,16,240,0.2)]'
                    : 'border-white/10 bg-gray-900/40 hover:border-white/20 transition-all duration-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`w-8 font-black text-xl ${
                      index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-400' : 'text-gray-600'
                    }`}
                  >
                    #{index + 1}
                  </span>
                  <div className="flex flex-col">
                    <span className={`font-mono font-bold ${player.isCurrentUser ? 'text-neonPink' : 'text-white'}`}>
                      {truncate(player.address)}
                    </span>
                    {player.isCurrentUser && (
                      <span className="text-[10px] text-neonPink uppercase font-black tracking-widest mt-0.5">You</span>
                    )}
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
              {error ? `ERROR: ${error}` : 'No matches settled on-chain yet.'}
            </div>
          )}
        </div>

        <div className="text-center mt-2 pt-4 border-t border-white/5">
          <p className="text-xs font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-neonGreen to-neonBlue drop-shadow-[0_0_8px_rgba(57,255,20,0.3)] uppercase">
            Total Active Strikers: {rows.length}
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
