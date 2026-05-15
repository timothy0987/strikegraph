import React, { createContext, useContext, useState } from 'react';
import { useAccount, useBalance } from 'wagmi';

const GameContext = createContext();

export const TREASURY_ADDRESS = "0x7cbff11440099db224d2b54d12e1116eb565c8fe";

export const GameProvider = ({ children }) => {
  // 'menu', 'market', 'aiming', 'kicking', 'result'
  const [gameState, setGameState] = useState('menu');
  
  // Web3 Hooks
  const { address, isConnected: walletConnected } = useAccount();
  const { data: balanceData } = useBalance({ address });
  const balance = balanceData ? parseFloat(balanceData.formatted) : 0;
  const walletAddress = address || "";
  
  // Kicker Stats
  const freeKicker = { type: 'Free', power: 50, accuracy: 50, color: '#39FF14' };
  const premiumKicker = { type: 'Premium', power: 85, accuracy: 80, color: '#FF10F0' };
  
  const [currentKicker, setCurrentKicker] = useState(freeKicker);
  
  // Game Resolution
  const [result, setResult] = useState(null); // 'GOAL' or 'SAVED'

  const buyPremiumKicker = () => {
    if (balance >= 500) {
      // In a real app, this would trigger a write contract transaction.
      // For now, we just update the local kicker state if balance is sufficient.
      setCurrentKicker(premiumKicker);
      console.log(`Transaction simulation to ${TREASURY_ADDRESS}: 500 HBAR`);
      return true;
    }
    return false;
  };

  return (
    <GameContext.Provider value={{
      gameState, setGameState,
      walletConnected, connectWallet,
      walletAddress, balance,
      currentKicker, setCurrentKicker,
      freeKicker, premiumKicker,
      buyPremiumKicker,
      result, setResult
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
