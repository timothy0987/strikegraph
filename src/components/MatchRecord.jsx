import React, { useEffect, useState } from 'react';
import { formatEther } from 'viem';
import { GOLAZO_ARENA_ADDRESS } from '../config/contract';

const EXPLORER_API = 'https://maculatus-scan.x1eco.com/api';
const SHOT_RESOLVED_TOPIC = '0xf01431bfe0148086eba32c9b4b9d973149cc2485eedd599ce52a83bfccf26db7';

const pad32 = (addr) => `0x${'0'.repeat(24)}${addr.replace(/^0x/, '').toLowerCase()}`;

const Cell = ({ label, value }) => (
  <div className="flex flex-col items-center">
    <span className="text-lg font-black text-white">{value}</span>
    <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">{label}</span>
  </div>
);

const MatchRecord = ({ address }) => {
  const [rec, setRec] = useState(null);

  useEffect(() => {
    if (!address) return;
    let alive = true;

    const load = async () => {
      try {
        const url =
          `${EXPLORER_API}?module=logs&action=getLogs&fromBlock=0&toBlock=latest` +
          `&address=${GOLAZO_ARENA_ADDRESS}&topic0=${SHOT_RESOLVED_TOPIC}` +
          `&topic1=${pad32(address)}&topic0_1_opr=and`;
        const r = await fetch(url);
        const j = await r.json();
        const logs = Array.isArray(j.result) ? j.result : [];

        let wins = 0;
        let losses = 0;
        let bestPayout = 0n;
        let totalWon = 0n;
        logs.forEach((log) => {
          const data = (log.data || '').replace(/^0x/, '');
          const goal = parseInt(data.slice(128, 192) || '0', 16) === 1;
          const payout = BigInt(`0x${data.slice(192, 256) || '0'}`);
          if (goal) {
            wins += 1;
            totalWon += payout;
            if (payout > bestPayout) bestPayout = payout;
          } else {
            losses += 1;
          }
        });

        const played = wins + losses;
        if (alive) {
          setRec({
            played,
            wins,
            losses,
            winRate: played ? Math.round((wins / played) * 100) : 0,
            bestPayout: formatEther(bestPayout),
            totalWon: formatEther(totalWon),
          });
        }
      } catch {
        if (alive) setRec(null);
      }
    };

    load();
    const id = setInterval(load, 12000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [address]);

  if (!rec || rec.played === 0) return null;

  return (
    <div className="rounded-lg border border-neonBlue/20 bg-neonBlue/5 px-4 py-3">
      <p className="text-[10px] text-neonBlue uppercase font-black tracking-widest text-center mb-2">Your on-chain record</p>
      <div className="flex justify-around">
        <Cell label="Played" value={rec.played} />
        <Cell label="W – L" value={`${rec.wins}–${rec.losses}`} />
        <Cell label="Win %" value={`${rec.winRate}%`} />
        <Cell label="Best" value={`${Number(rec.bestPayout)} X1T`} />
      </div>
    </div>
  );
};

export default MatchRecord;
