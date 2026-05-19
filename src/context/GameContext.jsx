import React, { createContext, useContext, useState } from 'react';
import { useAccount, useBalance } from 'wagmi';

const GameContext = createContext();

export const TREASURY_ADDRESS = "0x7cbff11440099db224d2b54d12e1116eb565c8fe";

const playerVariants = [
  { id: 'base', name: 'Base', price: 0, color: '#00FFFF', power: 1.0, accuracy: 1.0 },
  { id: 'striker', name: 'Striker', price: 50, color: '#FF0033', power: 1.5, accuracy: 1.0 },
  { id: 'sniper', name: 'Sniper', price: 100, color: '#00FF33', power: 1.0, accuracy: 1.5 },
  { id: 'legend', name: 'Legend', price: 500, color: '#FFD700', power: 1.8, accuracy: 1.8 }
];

export const GameProvider = ({ children }) => {
  // 'menu', 'market', 'aiming', 'kicking', 'result'
  const [gameState, setGameState] = useState('menu');
  
  // Web3 Hooks
  const { address, isConnected: walletConnected } = useAccount();
  const { data: balanceData } = useBalance({ address });
  const balance = balanceData ? parseFloat(balanceData.formatted) : 0;
  const walletAddress = address || "";

  const [selectedPlayer, setSelectedPlayer] = useState(playerVariants[0]);
  
  // Game Resolution
  const [result, setResult] = useState(null); // 'GOAL' or 'SAVED'

  return (
    <GameContext.Provider value={{
      gameState, setGameState,
      walletConnected,
      walletAddress, balance,
      playerVariants, selectedPlayer, setSelectedPlayer,
      result, setResult
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
