import React from 'react';
import { useGame } from '../context/GameContext';
import { Wallet, Coins, Trophy } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useHederaNativeId } from '../hooks/useHederaNativeId';

const MainMenu = () => {
  const { setGameState, balance, currentKicker, walletAddress } = useGame();
  const { nativeId } = useHederaNativeId(walletAddress);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-black/40 backdrop-blur-sm">
      
      {/* Top Bar for Wallet */}
      <div className="absolute top-4 right-4 flex gap-4">
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            authenticationStatus,
            mounted,
          }) => {
            const ready = mounted && authenticationStatus !== 'loading';
            const connected =
              ready &&
              account &&
              chain &&
              (!authenticationStatus ||
                authenticationStatus === 'authenticated');

            return (
              <div
                {...(!ready && {
                  'aria-hidden': true,
                  'style': {
                    opacity: 0,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  },
                })}
              >
                {(() => {
                  if (!connected) {
                    return (
                      <button onClick={openConnectModal} type="button" className="btn-neon flex items-center gap-2 text-sm px-4 py-2">
                        <Wallet size={16} /> Connect Wallet
                      </button>
                    );
                  }

                  if (chain.unsupported) {
                    return (
                      <button onClick={openChainModal} type="button" className="btn-premium flex items-center gap-2 text-sm px-4 py-2">
                        Wrong network
                      </button>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button
                        onClick={openChainModal}
                        style={{ display: 'flex', alignItems: 'center' }}
                        type="button"
                        className="glass-panel px-4 py-2 text-neonBlue font-bold text-sm"
                      >
                        {chain.hasIcon && (
                          <div
                            style={{
                              background: chain.iconBackground,
                              width: 12,
                              height: 12,
                              borderRadius: 999,
                              overflow: 'hidden',
                              marginRight: 4,
                            }}
                          >
                            {chain.iconUrl && (
                              <img
                                alt={chain.name ?? 'Chain icon'}
                                src={chain.iconUrl}
                                style={{ width: 12, height: 12 }}
                              />
                            )}
                          </div>
                        )}
                        {chain.name}
                      </button>

                      <button onClick={openAccountModal} type="button" className="glass-panel px-4 py-2 flex items-center gap-3 text-neonGreen font-bold text-sm">
                        <span>{nativeId || account.displayName}</span>
                        {account.displayBalance && (
                          <span className="flex items-center gap-1 text-neonPink">
                             <Coins size={16} /> {account.displayBalance}
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>

      <div className="glass-panel p-10 flex flex-col items-center gap-8 min-w-[400px]">
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neonGreen to-neonBlue drop-shadow-[0_0_10px_rgba(57,255,20,0.5)]">
          STRIKEGRAPH
        </h1>
        
        <div className="text-gray-400 flex flex-col items-center gap-2">
          <span>Current Kicker: <span style={{ color: currentKicker.color }} className="font-bold">{currentKicker.type}</span></span>
          <div className="flex gap-4 text-sm">
            <span>PWR: {currentKicker.power}</span>
            <span>ACC: {currentKicker.accuracy}</span>
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full">
          <button 
            onClick={() => setGameState('aiming')} 
            className="btn-neon w-full py-4 text-xl"
          >
            PLAY NOW
          </button>
          <button 
            onClick={() => setGameState('market')} 
            className="glass-panel py-3 text-gray-300 hover:text-white transition-colors border border-white/10 hover:border-white/30"
          >
            TRANSFER MARKET
          </button>
          <button 
            onClick={() => setGameState('leaderboard')} 
            className="glass-panel py-3 text-gray-300 hover:text-white transition-colors border border-white/10 hover:border-white/30 flex items-center justify-center gap-2"
          >
            <Trophy size={16} className="text-neonGreen" /> LEADERBOARD
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
