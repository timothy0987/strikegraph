import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { STRIKEGRAPH_STORE_ADDRESS, STRIKEGRAPH_STORE_ABI } from '../config/contract';

const GameContext = createContext();

export const TREASURY_ADDRESS = "0x7cbff11440099db224d2b54d12e1116eb565c8fe";

const playerVariants = [
  { id: 'base', name: 'Base', price: 0, color: '#00FFFF', power: 1.0, accuracy: 1.0 },
  { id: 'striker', name: 'Striker', price: 50, color: '#FF0033', power: 1.5, accuracy: 1.0 },
  { id: 'sniper', name: 'Sniper', price: 100, color: '#00FF33', power: 1.0, accuracy: 1.5 },
  { id: 'legend', name: 'Legend', price: 500, color: '#FFD700', power: 1.8, accuracy: 1.8 }
];

export const GameProvider = ({ children }) => {
  // 'menu', 'staking', 'aiming', 'kicking', 'result'
  const [gameState, setGameState] = useState('menu');
  
  // Web3 Hooks
  const { address, isConnected: walletConnected } = useAccount();
  
  // Memoize config to prevent infinite render/fetch loops
  const balanceConfig = React.useMemo(() => ({
    address,
    query: {
      enabled: !!address,
      notifyOnChangeProps: ['data'],
    }
  }), [address]);

  const { data: balanceData } = useBalance(balanceConfig);
  const balance = balanceData ? parseFloat(balanceData.formatted) : 0;
  const walletAddress = address || "";

  const [selectedPlayer, setSelectedPlayer] = useState(playerVariants[0]);
  
  // Game Resolution
  const [result, setResult] = useState(null); // 'GOAL' or 'SAVED'

  // Blockchain Transaction States
  const [isPending, setIsPending] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const [txHash, setTxHash] = useState(null);
  const [currentAction, setCurrentAction] = useState(null); // 'staking' | 'resolving'

  const { writeContract, data: writeHash, error: writeError } = useWriteContract();
  
  // Memoize config to prevent infinite render loops when txHash is null/undefined
  const waitConfig = React.useMemo(() => ({
    hash: txHash || undefined,
    query: {
      enabled: !!txHash,
    }
  }), [txHash]);

  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt(waitConfig);

  const stakeOnChain = (amountHbar) => {
    setIsPending(true);
    setPendingMessage(`Staking ${amountHbar} HBAR...`);
    setCurrentAction('staking');
    writeContract({
      address: STRIKEGRAPH_STORE_ADDRESS,
      abi: STRIKEGRAPH_STORE_ABI,
      functionName: 'stake',
      value: parseEther(amountHbar.toString()),
      gas: 300000n,
    }, {
      onSuccess: (hash) => {
        setTxHash(hash);
        setPendingMessage("Confirming transaction...");
      },
      onError: (err) => {
        console.error("Stake transaction failed", err);
        setIsPending(false);
        setPendingMessage("");
        setCurrentAction(null);
        alert("Transaction failed: " + (err.shortMessage || err.message));
      }
    });
  };

  const resolveGameOnChain = (won) => {
    setIsPending(true);
    setPendingMessage("Resolving game result on blockchain...");
    setCurrentAction('resolving');
    writeContract({
      address: STRIKEGRAPH_STORE_ADDRESS,
      abi: STRIKEGRAPH_STORE_ABI,
      functionName: 'resolveGame',
      args: [won],
      gas: 300000n,
    }, {
      onSuccess: (hash) => {
        setTxHash(hash);
        setPendingMessage("Confirming payout resolution...");
      },
      onError: (err) => {
        console.error("Resolution transaction failed", err);
        setIsPending(false);
        setPendingMessage("");
        setCurrentAction(null);
        alert("Resolution transaction failed: " + (err.shortMessage || err.message));
        setGameState('menu');
      }
    });
  };

  useEffect(() => {
    if (isConfirmed && txHash) {
      setIsPending(false);
      setPendingMessage("");
      setTxHash(null);
      
      if (currentAction === 'staking') {
        setGameState('aiming');
      } else if (currentAction === 'resolving') {
        setGameState('menu');
      }
      setCurrentAction(null);
    }
  }, [isConfirmed, txHash, currentAction]);

  useEffect(() => {
    if (confirmError && txHash) {
      setIsPending(false);
      setPendingMessage("");
      setTxHash(null);
      setCurrentAction(null);
      alert("Transaction confirmation failed: " + confirmError.message);
      setGameState('menu');
    }
  }, [confirmError, txHash]);

  return (
    <GameContext.Provider value={{
      gameState, setGameState,
      walletConnected,
      walletAddress, balance,
      playerVariants, selectedPlayer, setSelectedPlayer,
      result, setResult,
      isPending, pendingMessage,
      stakeOnChain, resolveGameOnChain
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
