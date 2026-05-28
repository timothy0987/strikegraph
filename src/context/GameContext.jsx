import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import { STRIKEGRAPH_STORE_ADDRESS, STRIKEGRAPH_STORE_ABI } from '../config/contract';

const GameContext = createContext();

export const TREASURY_ADDRESS = "0x7cbff11440099db224d2b54d12e1116eb565c8fe";

const playerVariants = [
  { id: 'base', tier: 0, name: 'Base', price: 0, color: '#00FFFF', power: 1.0, accuracy: 1.0 },
  { id: 'striker', tier: 1, name: 'Striker', price: 50, color: '#FF0033', power: 1.5, accuracy: 1.0 },
  { id: 'sniper', tier: 2, name: 'Sniper', price: 100, color: '#00FF33', power: 1.0, accuracy: 1.5 },
  { id: 'legend', tier: 3, name: 'Legend', price: 500, color: '#FFD700', power: 1.8, accuracy: 2.0 }
];

export const GameProvider = ({ children }) => {
  // 'menu', 'staking', 'aiming', 'kicking', 'result'
  const [gameState, setGameState] = useState('menu');
  const [resetTrigger, setResetTrigger] = useState(0);
  const triggerReset = () => setResetTrigger((prev) => prev + 1);
  
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

  // Read active stake on-chain to handle state recovery and prevent duplicate staking reverts
  const activeStakeConfig = React.useMemo(() => ({
    address: STRIKEGRAPH_STORE_ADDRESS,
    abi: STRIKEGRAPH_STORE_ABI,
    functionName: 'activeStakes',
    args: walletAddress ? [walletAddress] : undefined,
    query: {
      enabled: !!walletAddress,
      notifyOnChangeProps: ['data'],
    }
  }), [walletAddress]);

  const { data: activeStakeData, refetch: refetchActiveStake } = useReadContract(activeStakeConfig);
  const activeStake = activeStakeData ? activeStakeData : 0n;

  // Read owned player tier on-chain
  const ownedTiersConfig = React.useMemo(() => ({
    address: STRIKEGRAPH_STORE_ADDRESS,
    abi: STRIKEGRAPH_STORE_ABI,
    functionName: 'ownedTiers',
    args: walletAddress ? [walletAddress] : undefined,
    query: {
      enabled: !!walletAddress,
      notifyOnChangeProps: ['data'],
    }
  }), [walletAddress]);

  const { data: ownedTierData, refetch: refetchOwnedTier } = useReadContract(ownedTiersConfig);
  const [userOwnedTier, setUserOwnedTier] = useState(0);

  useEffect(() => {
    if (ownedTierData !== undefined) {
      setUserOwnedTier(Number(ownedTierData));
    } else {
      setUserOwnedTier(0);
    }
  }, [ownedTierData]);

  const [selectedPlayer, setSelectedPlayer] = useState(playerVariants[0]);
  
  // Game Resolution
  const [result, setResult] = useState(null); // 'GOAL' or 'SAVED'

  // Blockchain Transaction States
  const [isPending, setIsPending] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const [txHash, setTxHash] = useState(null);
  const [currentAction, setCurrentAction] = useState(null); // 'staking' | 'resolving' | 'purchasing'

  const { writeContract, data: writeHash, error: writeError } = useWriteContract();
  
  // Memoize config to prevent infinite render loops when txHash is null/undefined
  const waitConfig = React.useMemo(() => ({
    hash: txHash || undefined,
    query: {
      enabled: !!txHash,
    }
  }), [txHash]);

  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt(waitConfig);

  const stakeOnChain = (amount) => {
    setIsPending(true);
    setPendingMessage(`Staking ${amount} HBAR...`);
    setCurrentAction('staking');
    writeContract({
      address: STRIKEGRAPH_STORE_ADDRESS,
      abi: STRIKEGRAPH_STORE_ABI,
      functionName: 'stake',
      value: parseEther(amount.toString()),
      type: 'legacy',
      gas: 500000n,
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

  const purchaseTierOnChain = (tierId, priceInHbar) => {
    setIsPending(true);
    setPendingMessage(`Purchasing Player Tier...`);
    setCurrentAction('purchasing');
    writeContract({
      address: STRIKEGRAPH_STORE_ADDRESS,
      abi: STRIKEGRAPH_STORE_ABI,
      functionName: 'buyPlayerVariant',
      args: [BigInt(tierId)],
      value: parseEther(priceInHbar.toString()),
      type: 'legacy',
      gas: 500000n,
    }, {
      onSuccess: (hash) => {
        setTxHash(hash);
        setPendingMessage("Confirming purchase transaction...");
      },
      onError: (err) => {
        console.error("Purchase transaction failed", err);
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
      type: 'legacy',
      gas: 500000n,
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
      
      // Refetch the active stake state on-chain
      if (refetchActiveStake) {
        refetchActiveStake();
      }
      
      // Refetch the owned tiers on-chain
      if (refetchOwnedTier) {
        refetchOwnedTier();
      }
      
      if (currentAction === 'staking') {
        setGameState('aiming');
      } else if (currentAction === 'resolving') {
        setGameState('menu');
      }
      setCurrentAction(null);
    }
  }, [isConfirmed, txHash, currentAction, refetchActiveStake, refetchOwnedTier]);

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
      activeStake, refetchActiveStake,
      playerVariants, selectedPlayer, setSelectedPlayer,
      result, setResult,
      isPending, pendingMessage,
      stakeOnChain, resolveGameOnChain,
      userOwnedTier, purchaseTierOnChain,
      resetTrigger, triggerReset
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);

