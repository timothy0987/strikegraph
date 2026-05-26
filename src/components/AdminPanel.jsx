import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useBalance, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { STRIKEGRAPH_STORE_ADDRESS, STRIKEGRAPH_STORE_ABI } from '../config/contract';
import { Landmark, ArrowDownCircle, ShieldCheck, AlertCircle } from 'lucide-react';

const AdminPanel = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [localError, setLocalError] = useState('');

  // 1. Read owner address from smart contract (memoized to prevent loops)
  const ownerReadConfig = React.useMemo(() => ({
    address: STRIKEGRAPH_STORE_ADDRESS,
    abi: STRIKEGRAPH_STORE_ABI,
    functionName: 'owner',
    query: {
      notifyOnChangeProps: ['data'],
    }
  }), []);

  const { data: ownerAddress, isLoading: isReadingOwner } = useReadContract(ownerReadConfig);

  // 2. Read current balance of the smart contract (memoized to prevent loops)
  const balanceConfig = React.useMemo(() => ({
    address: STRIKEGRAPH_STORE_ADDRESS,
    query: {
      notifyOnChangeProps: ['data'],
    }
  }), []);

  const { data: contractBalanceData, refetch: refetchBalance } = useBalance(balanceConfig);

  // 3. Write contract for withdrawLiquidity
  const { writeContract, data: txHash, error: writeError, isPending: isWritePending } = useWriteContract();

  // 4. Wait for transaction completion (memoized to prevent loops)
  const waitConfig = React.useMemo(() => ({
    hash: txHash || undefined,
    query: {
      enabled: !!txHash,
    }
  }), [txHash]);

  const { isLoading: isTxConfirming, isSuccess: isTxConfirmed } = useWaitForTransactionReceipt(waitConfig);

  // Refetch balance when transaction completes
  useEffect(() => {
    if (isTxConfirmed) {
      refetchBalance();
      setWithdrawAmount('');
      alert("Liquidity successfully withdrawn!");
    }
  }, [isTxConfirmed, refetchBalance]);

  const handleWithdraw = () => {
    setLocalError('');
    const val = parseFloat(withdrawAmount);
    if (isNaN(val) || val <= 0) {
      setLocalError("Please enter a valid HBAR amount");
      return;
    }

    if (contractBalanceData) {
      const contractBalance = parseFloat(contractBalanceData.formatted);
      if (val > contractBalance) {
        setLocalError(`Cannot withdraw more than current contract balance (${contractBalance} HBAR)`);
        return;
      }
    }

    writeContract({
      address: STRIKEGRAPH_STORE_ADDRESS,
      abi: STRIKEGRAPH_STORE_ABI,
      functionName: 'withdrawLiquidity',
      args: [parseEther(val.toString())],
      gas: 300000n,
    });
  };

  const isOwner = connectedAddress && ownerAddress && connectedAddress.toLowerCase() === ownerAddress.toLowerCase();

  // Loading state
  if (isReadingOwner) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-black/40 backdrop-blur-sm">
        <div className="w-12 h-12 border-4 border-t-neonGreen border-neonGreen/20 rounded-full animate-spin"></div>
        <span className="text-gray-400 font-mono mt-4">Verifying Admin Access...</span>
      </div>
    );
  }

  // Not connected or not Owner
  if (!isConnected || !isOwner) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-black/40 backdrop-blur-sm">
        <div className="glass-panel p-10 flex flex-col items-center gap-6 max-w-md border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
          <div className="p-4 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 animate-pulse">
            <AlertCircle size={40} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-widest text-center">
            ACCESS DENIED
          </h1>
          <p className="text-gray-400 text-sm text-center">
            This panel is restricted exclusively to the contract owner. Please connect the authorized admin wallet.
          </p>
        </div>
      </div>
    );
  }

  const isPending = isWritePending || isTxConfirming;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-black/40 backdrop-blur-sm p-4">
      <div className="glass-panel p-10 flex flex-col items-center gap-6 min-w-[450px] border border-neonGreen/20 shadow-[0_0_30px_rgba(57,255,20,0.1)] relative overflow-hidden">
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 p-2 bg-neonGreen/10 border-b border-l border-neonGreen/20 rounded-bl-lg text-neonGreen flex items-center gap-1 text-[10px] font-mono tracking-widest">
          <ShieldCheck size={12} /> SECURED ADMIN MODE
        </div>

        <div className="flex flex-col items-center gap-3 mt-4">
          <div className="p-4 rounded-full bg-neonGreen/10 border border-neonGreen/30 text-neonGreen">
            <Landmark size={40} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-widest text-center">
            HOUSE TREASURY
          </h1>
          <p className="text-gray-400 text-xs text-center font-mono">
            Contract: {STRIKEGRAPH_STORE_ADDRESS.slice(0, 8)}...{STRIKEGRAPH_STORE_ADDRESS.slice(-8)}
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 bg-black/40 border border-white/5 rounded-xl py-4 px-8 w-full">
          <span className="text-xs text-gray-400 uppercase tracking-widest font-mono">Contract Balance</span>
          <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neonGreen to-neonBlue tracking-wider">
            {contractBalanceData ? parseFloat(contractBalanceData.formatted).toFixed(2) : '0.00'} HBAR
          </span>
        </div>

        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-col gap-2 w-full">
            <label className="text-xs text-gray-400 font-mono tracking-widest uppercase">
              Withdrawal Amount (HBAR)
            </label>
            <input 
              type="number"
              min="0"
              step="any"
              placeholder="0.0"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              disabled={isPending}
              className="w-full bg-black/60 border border-white/10 hover:border-white/20 focus:border-neonGreen focus:outline-none text-white text-center font-bold text-xl py-3 rounded-lg tracking-wider transition-colors"
            />
          </div>

          {localError && (
            <p className="text-red-500 text-xs font-mono text-center">{localError}</p>
          )}

          {writeError && (
            <p className="text-red-500 text-xs font-mono text-center">
              Error: {writeError.shortMessage || writeError.message}
            </p>
          )}

          <button 
            disabled={isPending || !withdrawAmount}
            onClick={handleWithdraw} 
            className="btn-neon w-full py-4 text-xl flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] disabled:opacity-50 mt-2"
          >
            {isPending ? (
              <>
                <div className="w-5 h-5 border-2 border-t-white border-white/20 rounded-full animate-spin"></div>
                PROCESSING...
              </>
            ) : (
              <>
                <ArrowDownCircle size={20} /> WITHDRAW HOUSE FUNDS
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
