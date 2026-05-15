import React, { createContext, useContext, useState } from 'react';

const GameContext = createContext();

export const TREASURY_ADDRESS = "0x7cbff11440099db224d2b54d12e1116eb565c8fe";

export const GameProvider = ({ children }) => {
  // 'menu', 'market', 'aiming', 'kicking', 'result'
  const [gameState, setGameState] = useState('menu');
  
  // Web3 Mock State
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("0xTimoMockAddress890123456789abcdef");
  const [balance, setBalance] = useState(10000); // 10,000 HBAR
  
  // Kicker Stats
  const freeKicker = { type: 'Free', power: 50, accuracy: 50, color: '#39FF14' };
  const premiumKicker = { type: 'Premium', power: 85, accuracy: 80, color: '#FF10F0' };
  
  const [currentKicker, setCurrentKicker] = useState(freeKicker);
  
  // Game Resolution
  const [result, setResult] = useState(null); // 'GOAL' or 'SAVED'

  const connectWallet = () => {
    setWalletConnected(true);
  };

  const buyPremiumKicker = () => {
    if (balance >= 500) {
      setBalance(b => b - 500);
      setCurrentKicker(premiumKicker);
      console.log(`Transaction sent to ${TREASURY_ADDRESS}: 500 HBAR`);
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
