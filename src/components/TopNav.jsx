import React from 'react';
import { useGame } from '../context/GameContext';
import { Wallet, Coins, Trophy, Gamepad2 } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useHederaNativeId } from '../hooks/useHederaNativeId';

const TopNav = () => {
  const { gameState, setGameState, walletAddress } = useGame();
  const { nativeId } = useHederaNativeId(walletAddress);

  // We consider 'menu', 'aiming', 'kicking', 'result', 'market' all under the "Play" tab context
  const isLeaderboard = gameState === 'leaderboard';

  const handlePlayClick = () => {
    // If currently on leaderboard, returning to play should go to menu
    if (isLeaderboard) {
      setGameState('menu');
    }
  };

  const handleLeaderboardClick = () => {
    setGameState('leaderboard');
  };

  return (
    <nav className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-50 pointer-events-auto bg-black/40 backdrop-blur-md border-b border-white/10">
      <div className="flex items-center gap-6 pl-4">
        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neonGreen to-neonBlue drop-shadow-[0_0_5px_rgba(57,255,20,0.5)] tracking-widest">
          STRIKEGRAPH
        </h1>
        <div className="flex gap-4 ml-8">
          <button
            onClick={handlePlayClick}
            className={`flex items-center gap-2 px-4 py-2 font-bold transition-all ${
              !isLeaderboard
                ? 'text-neonGreen border-b-2 border-neonGreen shadow-[0_4px_10px_-2px_rgba(57,255,20,0.5)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Gamepad2 size={18} /> PLAY
          </button>
          <button
            onClick={handleLeaderboardClick}
            className={`flex items-center gap-2 px-4 py-2 font-bold transition-all ${
              isLeaderboard
                ? 'text-neonPink border-b-2 border-neonPink shadow-[0_4px_10px_-2px_rgba(255,16,240,0.5)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Trophy size={18} /> LEADERBOARD
          </button>
        </div>
      </div>

      <div className="flex gap-4 pr-4">
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
    </nav>
  );
};

export default TopNav;
