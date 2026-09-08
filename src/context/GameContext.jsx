import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAccount, useBalance, useWriteContract, useReadContract, useConfig } from 'wagmi';
import { waitForTransactionReceipt, getPublicClient } from 'wagmi/actions';
import { parseEther, formatEther, encodePacked, keccak256, parseEventLogs } from 'viem';
import { GOLAZO_ARENA_ADDRESS, GOLAZO_ARENA_ABI } from '../config/contract';

const GameContext = createContext();

export const TREASURY_ADDRESS = '0x7cbff11440099db224d2b54d12e1116eb565c8fe';
const PENDING_KEY = 'golazo_match_v2';

const playerVariants = [
  { id: 'base', tier: 0, name: 'Base', price: 0, color: '#00FFFF', power: 1.0, accuracy: 1.0 },
  { id: 'striker', tier: 1, name: 'Striker', price: 5, color: '#FF0033', power: 1.3, accuracy: 1.6 },
  { id: 'sniper', tier: 2, name: 'Sniper', price: 10, color: '#00FF33', power: 1.5, accuracy: 1.8 },
  { id: 'legend', tier: 3, name: 'Legend', price: 25, color: '#FFD700', power: 3.0, accuracy: 3.0 },
];

const randomSalt = () => {
  const b = new Uint8Array(32);
  (globalThis.crypto || window.crypto).getRandomValues(b);
  return `0x${Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')}`;
};

const lowestSetBit = (mask) => {
  for (let i = 0; i < 6; i += 1) if (mask & (1 << i)) return i;
  return 0;
};

export const GameProvider = ({ children }) => {
  const [gameState, setGameState] = useState('menu'); // menu | staking | aiming | kicking | result
  const [resetTrigger, setResetTrigger] = useState(0);
  const triggerReset = () => setResetTrigger((p) => p + 1);

  const wagmiConfig = useConfig();
  const { address, isConnected: walletConnected } = useAccount();
  const walletAddress = address || '';

  const balanceConfig = React.useMemo(
    () => ({ address, query: { enabled: !!address, notifyOnChangeProps: ['data'] } }),
    [address],
  );
  const { data: balanceData, refetch: refetchBalance } = useBalance(balanceConfig);
  const balance = balanceData ? parseFloat(balanceData.formatted) : 0;

  // Highest variant NFT tier held (0 = Base)
  const tierConfig = React.useMemo(
    () => ({
      address: GOLAZO_ARENA_ADDRESS,
      abi: GOLAZO_ARENA_ABI,
      functionName: 'highestTier',
      args: walletAddress ? [walletAddress] : undefined,
      query: { enabled: !!walletAddress, notifyOnChangeProps: ['data'] },
    }),
    [walletAddress],
  );
  const { data: tierData, refetch: refetchTier } = useReadContract(tierConfig);
  const userOwnedTier = tierData !== undefined ? Number(tierData) : 0;

  // Is there an unrevealed match on-chain? (used for resume UX)
  const matchConfig = React.useMemo(
    () => ({
      address: GOLAZO_ARENA_ADDRESS,
      abi: GOLAZO_ARENA_ABI,
      functionName: 'matches',
      args: walletAddress ? [walletAddress] : undefined,
      query: { enabled: !!walletAddress, notifyOnChangeProps: ['data'] },
    }),
    [walletAddress],
  );
  const { data: matchData, refetch: refetchMatch } = useReadContract(matchConfig);
  const hasOpenCommit = !!matchData && matchData[1] !== 0n; // matchData = [stake, commitBlock, commitment]

  const [selectedPlayer, setSelectedPlayer] = useState(playerVariants[0]);
  const [stakeAmount, setStakeAmount] = useState(0.5);

  const [result, setResult] = useState(null); // 'GOAL' | 'SAVED'
  // { goal, keeperMask, keeperZone, shotZone, payout (X1T str), gasX1T (str), commitHash, revealHash }
  const [chainResult, setChainResult] = useState(null);

  const [isPending, setIsPending] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const [lastMintedTokenId, setLastMintedTokenId] = useState(null);

  const { writeContractAsync } = useWriteContract();

  const txCost = (rcpt) => {
    try {
      return (rcpt.gasUsed ?? 0n) * (rcpt.effectiveGasPrice ?? 0n);
    } catch {
      return 0n;
    }
  };

  const failOut = useCallback((label, err) => {
    console.error(label, err);
    setIsPending(false);
    setPendingMessage('');
    const msg = err?.shortMessage || err?.message || String(err);
    alert(`${label}: ${msg}`);
  }, []);

  /**
   * Trust-minimised penalty: commit a hashed shot, wait for the seed block,
   * reveal, and read the outcome the contract computed from the block hash.
   */
  const playPenalty = useCallback(
    async (shotZone, amount) => {
      if (!walletAddress) {
        alert('Connect your wallet first');
        return;
      }
      setChainResult(null);
      setResult(null);
      setIsPending(true);

      const salt = randomSalt();
      const commitment = keccak256(
        encodePacked(['uint8', 'bytes32', 'address'], [shotZone, salt, walletAddress]),
      );

      try {
        localStorage.setItem(
          PENDING_KEY,
          JSON.stringify({ shotZone, salt, amount, addr: walletAddress.toLowerCase() }),
        );
      } catch {
        /* storage optional */
      }

      let commitCost = 0n;
      try {
        setPendingMessage('Locking your shot on-chain…');
        const commitHash = await writeContractAsync({
          address: GOLAZO_ARENA_ADDRESS,
          abi: GOLAZO_ARENA_ABI,
          functionName: 'commitShot',
          args: [commitment],
          value: parseEther(amount.toString()),
        });
        setPendingMessage('Shot committed — sealing the keeper’s dive…');
        const commitRcpt = await waitForTransactionReceipt(wagmiConfig, { hash: commitHash });
        commitCost = txCost(commitRcpt);
        const commitBlock = Number(commitRcpt.blockNumber);

        // reveal needs block.number > commitBlock + 1 so blockhash(commitBlock+1) exists
        setPendingMessage('Waiting for the seed block…');
        const pub = getPublicClient(wagmiConfig);
        for (let i = 0; i < 40; i += 1) {
          const bn = await pub.getBlockNumber();
          if (Number(bn) > commitBlock + 1) break;
          await new Promise((r) => setTimeout(r, 1500));
        }

        setPendingMessage('Revealing the shot…');
        const revealHash = await writeContractAsync({
          address: GOLAZO_ARENA_ADDRESS,
          abi: GOLAZO_ARENA_ABI,
          functionName: 'revealShot',
          args: [shotZone, salt],
        });
        setPendingMessage('Settling on X1…');
        const revealRcpt = await waitForTransactionReceipt(wagmiConfig, { hash: revealHash });

        const [ev] = parseEventLogs({
          abi: GOLAZO_ARENA_ABI,
          eventName: 'ShotResolved',
          logs: revealRcpt.logs,
        });
        const goal = Boolean(ev.args.goal);
        const keeperMask = Number(ev.args.keeperMask);
        const payout = formatEther(ev.args.payout);
        const gasWei = commitCost + txCost(revealRcpt);

        try {
          localStorage.removeItem(PENDING_KEY);
        } catch {
          /* noop */
        }

        setChainResult({
          goal,
          keeperMask,
          keeperZone: goal ? lowestSetBit(keeperMask) : shotZone,
          shotZone,
          payout,
          gasX1T: formatEther(gasWei),
          commitHash,
          revealHash,
        });
        setIsPending(false);
        setPendingMessage('');
        refetchTier?.();
        refetchMatch?.();
        refetchBalance?.();
      } catch (err) {
        // commit may have landed; keep PENDING_KEY so the match can be resumed
        failOut('Penalty failed', err);
        setGameState('menu');
        refetchMatch?.();
      }
    },
    [walletAddress, wagmiConfig, writeContractAsync, failOut, refetchTier, refetchMatch, refetchBalance],
  );

  // Finish a match that was committed but never revealed (same device / salt in storage)
  const resumePenalty = useCallback(async () => {
    let saved;
    try {
      saved = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null');
    } catch {
      saved = null;
    }
    if (!saved || saved.addr !== walletAddress.toLowerCase()) {
      alert('This match was committed on another device, so its shot secret is not here. The stake auto-returns to the treasury after the reveal window.');
      return;
    }
    setIsPending(true);
    try {
      setPendingMessage('Revealing your committed shot…');
      const revealHash = await writeContractAsync({
        address: GOLAZO_ARENA_ADDRESS,
        abi: GOLAZO_ARENA_ABI,
        functionName: 'revealShot',
        args: [saved.shotZone, saved.salt],
      });
      const revealRcpt = await waitForTransactionReceipt(wagmiConfig, { hash: revealHash });
      const [ev] = parseEventLogs({ abi: GOLAZO_ARENA_ABI, eventName: 'ShotResolved', logs: revealRcpt.logs });
      const goal = Boolean(ev.args.goal);
      const keeperMask = Number(ev.args.keeperMask);
      localStorage.removeItem(PENDING_KEY);
      setChainResult({
        goal,
        keeperMask,
        keeperZone: goal ? lowestSetBit(keeperMask) : saved.shotZone,
        shotZone: saved.shotZone,
        payout: formatEther(ev.args.payout),
        gasX1T: formatEther(txCost(revealRcpt)),
        commitHash: null,
        revealHash,
      });
      setIsPending(false);
      setPendingMessage('');
      refetchTier?.();
      refetchMatch?.();
      refetchBalance?.();
    } catch (err) {
      failOut('Reveal failed', err);
    }
  }, [walletAddress, wagmiConfig, writeContractAsync, failOut, refetchTier, refetchMatch, refetchBalance]);

  const buyVariant = useCallback(
    async (tier, priceX1T) => {
      if (!walletAddress) {
        alert('Connect your wallet first');
        return;
      }
      setIsPending(true);
      setLastMintedTokenId(null);
      try {
        setPendingMessage('Minting your player NFT…');
        const hash = await writeContractAsync({
          address: GOLAZO_ARENA_ADDRESS,
          abi: GOLAZO_ARENA_ABI,
          functionName: 'buyPlayerVariant',
          args: [tier],
          value: parseEther(priceX1T.toString()),
        });
        setPendingMessage('Confirming mint…');
        const rcpt = await waitForTransactionReceipt(wagmiConfig, { hash });
        const [ev] = parseEventLogs({ abi: GOLAZO_ARENA_ABI, eventName: 'VariantMinted', logs: rcpt.logs });
        if (ev) setLastMintedTokenId(Number(ev.args.tokenId));
        setIsPending(false);
        setPendingMessage('');
        refetchTier?.();
        refetchBalance?.();
      } catch (err) {
        failOut('Mint failed', err);
      }
    },
    [walletAddress, wagmiConfig, writeContractAsync, failOut, refetchTier, refetchBalance],
  );

  // Keep any stale localStorage in sync if the chain says there's no open match
  useEffect(() => {
    if (!hasOpenCommit) {
      try {
        localStorage.removeItem(PENDING_KEY);
      } catch {
        /* noop */
      }
    }
  }, [hasOpenCommit]);

  return (
    <GameContext.Provider
      value={{
        gameState,
        setGameState,
        walletConnected,
        walletAddress,
        balance,
        playerVariants,
        selectedPlayer,
        setSelectedPlayer,
        stakeAmount,
        setStakeAmount,
        result,
        setResult,
        chainResult,
        setChainResult,
        isPending,
        pendingMessage,
        playPenalty,
        resumePenalty,
        hasOpenCommit,
        userOwnedTier,
        buyVariant,
        lastMintedTokenId,
        resetTrigger,
        triggerReset,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
