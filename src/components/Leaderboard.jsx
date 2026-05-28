import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { usePublicClient } from 'wagmi';
import { formatEther } from 'viem';
import { STRIKEGRAPH_STORE_ADDRESS, STRIKEGRAPH_STORE_ABI } from '../config/contract';
import { Trophy, Coins, Database, ShieldAlert } from 'lucide-react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';

const MOCK_ONCHAIN_LEADERBOARD = [
  { player: '0x3a921d7bc009db224d2b54d12e1116eb56ce491', amount: '12,450 HBAR', rawAmount: 12450, nativeId: 'striker.hbar' },
  { player: '0x7b1c11440099db224d2b54d12e1116eb56c028a', amount: '9,820 HBAR', rawAmount: 9820, nativeId: 'keeper_god.hbar' },
  { player: '0x15df11440099db224d2b54d12e1116eb56cd5c1', amount: '8,150 HBAR', rawAmount: 8150, nativeId: 'penalty_pro.hbar' },
  { player: '0x9e1211440099db224d2b54d12e1116eb56cab89', amount: '6,400 HBAR', rawAmount: 6400, nativeId: 'hedera_whale.hbar' },
  { player: '0x5c4fff2d11440099db224d2b54d12e1116eb565cf', amount: '5,900 HBAR', rawAmount: 5900, nativeId: 'strikegraph.hbar' },
  { player: '0x2c1011440099db224d2b54d12e1116eb56c34ab', amount: '4,200 HBAR', rawAmount: 4200, nativeId: 'hbar_maxi.hbar' },
  { player: '0x8f9c11440099db224d2b54d12e1116eb56cde78', amount: '3,850 HBAR', rawAmount: 3850, nativeId: 'clutch_player.hbar' },
  { player: '0x4d5e11440099db224d2b54d12e1116eb56c67f8', amount: '2,900 HBAR', rawAmount: 2900, nativeId: 'web3_legend.hbar' },
  { player: '0x0a1b11440099db224d2b54d12e1116eb56c2c3d', amount: '1,800 HBAR', rawAmount: 1800, nativeId: 'kick_master.hbar' },
  { player: '0x6e7f11440099db224d2b54d12e1116eb56c8a9b', amount: '950 HBAR', rawAmount: 950, nativeId: 'rookie_kick.hbar' }
];

const Leaderboard = () => {
  const { setGameState, walletAddress } = useGame();
  const publicClient = usePublicClient();
  
  const [activeTab, setActiveTab] = useState('onchain'); // 'xp' or 'onchain'
  const [xpData, setXpData] = useState([]);
  const [onchainData, setOnchainData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isUsingMock, setIsUsingMock] = useState(false);

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // 1. Fetch Real-time XP from Firebase
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

  // 2. Fetch On-Chain Earnings from Smart Contract Events
  useEffect(() => {
    const fetchOnChainEvents = async () => {
      if (!publicClient) {
        setOnchainData(MOCK_ONCHAIN_LEADERBOARD);
        setIsUsingMock(true);
        return;
      }
      
      setLoading(true);
      try {
        const logs = await publicClient.getContractEvents({
          address: STRIKEGRAPH_STORE_ADDRESS,
          abi: STRIKEGRAPH_STORE_ABI,
          eventName: 'GameResolved',
          fromBlock: 0n
        });

        if (!logs || logs.length === 0) {
          setOnchainData(MOCK_ONCHAIN_LEADERBOARD);
          setIsUsingMock(true);
        } else {
          const earnings = {};
          logs.forEach(log => {
            const { player, won, amount } = log.args;
            if (player && won && amount) {
              const formattedAmt = parseFloat(formatEther(amount));
              earnings[player] = (earnings[player] || 0) + formattedAmt;
            }
          });

          const sortedEarnings = Object.entries(earnings)
            .map(([player, amount]) => ({
              player,
              amount: amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' HBAR',
              rawAmount: amount,
              isCurrentUser: walletAddress && player.toLowerCase() === walletAddress.toLowerCase()
            }))
            .sort((a, b) => b.rawAmount - a.rawAmount)
            .slice(0, 10);

          if (sortedEarnings.length === 0) {
            setOnchainData(MOCK_ONCHAIN_LEADERBOARD);
            setIsUsingMock(true);
          } else {
            setOnchainData(sortedEarnings);
            setIsUsingMock(false);
          }
        }
      } catch (err) {
        console.error("Failed to load on-chain events, falling back to mock:", err);
        setOnchainData(MOCK_ONCHAIN_LEADERBOARD);
        setIsUsingMock(true);
      } finally {
        setLoading(false);
      }
    };

    fetchOnChainEvents();
  }, [publicClient, walletAddress]);

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

        {/* Tab Selection */}
        <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
          <button
            onClick={() => setActiveTab('onchain')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black rounded-md transition-all tracking-wider ${
              activeTab === 'onchain'
                ? 'bg-gradient-to-r from-neonGreen to-neonBlue text-black shadow-[0_0_15px_rgba(57,255,20,0.3)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Coins size={14} /> ON-CHAIN HBAR
          </button>
          <button
            onClick={() => setActiveTab('xp')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black rounded-md transition-all tracking-wider ${
              activeTab === 'xp'
                ? 'bg-gradient-to-r from-neonGreen to-neonBlue text-black shadow-[0_0_15px_rgba(57,255,20,0.3)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Database size={14} /> REAL-TIME XP
          </button>
        </div>

        {/* Info Label / Status */}
        {activeTab === 'onchain' && isUsingMock && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#FF5F1F]/10 border border-[#FF5F1F]/20 text-[#FF5F1F] rounded-lg text-[10px] font-bold uppercase tracking-wider">
            <ShieldAlert size={14} />
            <span>Direct Contract event logs fallback loaded successfully.</span>
          </div>
        )}

        {/* Rankings List */}
        <div className="mt-2 flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-2 border-t-neonGreen border-neonGreen/20 rounded-full animate-spin"></div>
              <span className="text-gray-500 text-xs font-mono uppercase tracking-widest">Indexing smart contract logs...</span>
            </div>
          ) : activeTab === 'onchain' ? (
            onchainData.length > 0 ? (
              onchainData.map((player, index) => {
                const isUser = walletAddress && player.player && player.player.toLowerCase() === walletAddress.toLowerCase();
                return (
                  <div 
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      isUser 
                        ? 'border-neonPink bg-neonPink/10 shadow-[0_0_15px_rgba(255,16,240,0.2)]' 
                        : 'border-white/10 bg-gray-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`w-8 font-black text-xl ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-400' : 'text-gray-600'}`}>
                        #{index + 1}
                      </span>
                      <div className="flex flex-col">
                        <span className={`font-mono text-sm font-bold ${isUser ? 'text-neonPink' : 'text-white'}`}>
                          {player.nativeId ? `${player.nativeId} (${truncateAddress(player.player)})` : truncateAddress(player.player)}
                        </span>
                        {isUser && <span className="text-[10px] text-neonPink uppercase font-black tracking-widest mt-0.5">You</span>}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-black text-neonGreen">{player.amount}</span>
                      <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">HBAR WON</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-gray-500 italic font-mono text-sm">
                No on-chain games resolved yet.
              </div>
            )
          ) : (
            xpData.length > 0 ? (
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
              <div className="text-center py-10 text-gray-500 italic font-mono text-sm">
                No XP data found.
              </div>
            )
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
