import React from 'react';
import { useGame } from '../context/GameContext';
import { Wallet, Coins, Trophy, Gamepad2, ShoppingCart, Shield, Menu, X } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useHederaNativeId } from '../hooks/useHederaNativeId';
import { useReadContract } from 'wagmi';
import { STRIKEGRAPH_STORE_ADDRESS, STRIKEGRAPH_STORE_ABI } from '../config/contract';

const TopNav = () => {
  const { gameState, setGameState, walletAddress } = useGame();
  const { nativeId } = useHederaNativeId(walletAddress);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Read owner address from smart contract (memoized to prevent infinite render loops)
  const ownerReadConfig = React.useMemo(() => ({
    address: STRIKEGRAPH_STORE_ADDRESS,
    abi: STRIKEGRAPH_STORE_ABI,
    functionName: 'owner',
    query: {
      notifyOnChangeProps: ['data'],
    }
  }), []);

  const { data: ownerAddress } = useReadContract(ownerReadConfig);

  const showAdminTab = walletAddress && ownerAddress && walletAddress.toLowerCase() === ownerAddress.toLowerCase();

  const isAdmin = gameState === 'admin';
  const isLeaderboard = gameState === 'leaderboard';
  const isMarket = gameState === 'market';
  const isDefend = gameState === 'defend';
  const isPlay = !isLeaderboard && !isMarket && !isAdmin && !isDefend;

  const handlePlayClick = () => setGameState('menu');
  const handleMarketClick = () => setGameState('market');
  const handleLeaderboardClick = () => setGameState('leaderboard');
  const handleDefendClick = () => setGameState('defend');
  const handleAdminClick = () => setGameState('admin');

  return (
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
          <>
            <nav className="absolute top-0 left-0 w-full flex items-center justify-between p-4 px-4 overflow-hidden z-40 pointer-events-auto bg-black/40 backdrop-blur-md border-b border-white/10">
              {/* Left side: Logo & Desktop links */}
              <div className="flex items-center gap-6 pl-4">
                <img
                  src="/logo.png"
                  alt="StrikeGraph AI Logo"
                  onClick={handlePlayClick}
                  className="h-8 sm:h-10 w-auto object-contain cursor-pointer"
                />
                <div className="hidden md:flex gap-4 ml-8">
                  <button
                    onClick={handlePlayClick}
                    className={`flex items-center gap-2 px-4 py-2 font-bold transition-all ${
                      isPlay
                        ? 'text-neonGreen border-b-2 border-neonGreen shadow-[0_4px_10px_-2px_rgba(57,255,20,0.5)]'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Gamepad2 size={18} /> PLAY
                  </button>
                  <button
                    onClick={handleMarketClick}
                    className={`flex items-center gap-2 px-4 py-2 font-bold transition-all ${
                      isMarket
                        ? 'text-[#00FFFF] border-b-2 border-[#00FFFF] shadow-[0_4px_10px_-2px_rgba(0,255,255,0.5)]'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <ShoppingCart size={18} /> MARKET
                  </button>
                  <button
                    onClick={handleDefendClick}
                    className={`flex items-center gap-2 px-4 py-2 font-bold transition-all ${
                      isDefend
                        ? 'text-[#FF5F1F] border-b-2 border-[#FF5F1F] shadow-[0_4px_10px_-2px_rgba(255,95,31,0.5)]'
                        : 'text-gray-400 hover:text-white'
                    }`}
                    style={isDefend ? {
                      color: '#FF5F1F',
                      borderColor: '#FF5F1F',
                      textShadow: '0 0 5px #FF5F1F'
                    } : {}}
                  >
                    <Shield size={18} /> DEFEND
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
                  {showAdminTab && (
                    <button
                      onClick={handleAdminClick}
                      className={`flex items-center gap-2 px-4 py-2 font-bold transition-all ${
                        isAdmin
                          ? 'text-neonGreen border-b-2 border-neonGreen shadow-[0_4px_10px_-2px_rgba(57,255,20,0.5)]'
                          : 'text-gray-400 hover:text-white'
                      }`}
                      style={isAdmin ? {
                        color: '#39FF14',
                        borderColor: '#39FF14',
                        textShadow: '0 0 5px #39FF14'
                      } : {}}
                    >
                      <Shield size={18} /> ADMIN
                    </button>
                  )}
                </div>
              </div>

              {/* Right side: Wallet Connect & Hamburger Menu */}
              <div className="flex items-center gap-3">
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
                      <div className="flex items-center gap-2 md:gap-3">
                        {/* Network Name - Hidden on mobile screens */}
                        <button
                          onClick={openChainModal}
                          type="button"
                          className="hidden md:flex items-center glass-panel px-4 py-2 text-neonBlue font-bold text-sm"
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

                        <button onClick={openAccountModal} type="button" className="glass-panel px-3 py-2 md:px-4 flex items-center gap-2 md:gap-3 text-neonGreen font-bold text-xs md:text-sm">
                          <span>{nativeId || account.displayName}</span>
                          {account.displayBalance && (
                            <span className="hidden sm:inline-block text-neonPink border-l border-white/20 pl-2 md:pl-3">
                               <Coins size={14} className="inline mr-1" /> {account.displayBalance}
                            </span>
                          )}
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {/* Mobile Hamburger Icon */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-white text-3xl block md:hidden z-50 p-2 focus:outline-none hover:text-neonGreen transition-colors"
                >
                  {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
              </div>
            </nav>

            {/* Mobile Full Screen Menu Overlay */}
            {isMobileMenuOpen && (
              <div className="fixed inset-0 h-[100dvh] w-screen bg-black/95 backdrop-blur-lg flex flex-col justify-center items-center gap-6 p-6 md:hidden z-50 pointer-events-auto">
                {/* Close Button top-right */}
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="absolute top-4 right-4 text-white text-3xl p-2 hover:text-neonGreen transition-colors"
                >
                  <X size={28} />
                </button>

                <img
                  src="/logo.png"
                  alt="StrikeGraph AI Logo"
                  className="h-12 w-auto object-contain mb-8"
                />

                <div className="flex flex-col gap-3 w-full max-w-[280px]">
                  <button
                    onClick={() => { handlePlayClick(); setIsMobileMenuOpen(false); }}
                    className={`flex items-center justify-center gap-3 px-4 py-4 font-bold text-lg transition-all w-full rounded-lg ${
                      isPlay ? 'bg-neonGreen/10 text-neonGreen border border-neonGreen/30' : 'text-gray-400 border border-white/5 hover:text-white'
                    }`}
                  >
                    <Gamepad2 size={20} /> PLAY
                  </button>
                  <button
                    onClick={() => { handleMarketClick(); setIsMobileMenuOpen(false); }}
                    className={`flex items-center justify-center gap-3 px-4 py-4 font-bold text-lg transition-all w-full rounded-lg ${
                      isMarket ? 'bg-[#00FFFF]/10 text-[#00FFFF] border border-[#00FFFF]/30' : 'text-gray-400 border border-white/5 hover:text-white'
                    }`}
                  >
                    <ShoppingCart size={20} /> MARKET
                  </button>
                  <button
                    onClick={() => { handleDefendClick(); setIsMobileMenuOpen(false); }}
                    className={`flex items-center justify-center gap-3 px-4 py-4 font-bold text-lg transition-all w-full rounded-lg ${
                      isDefend ? 'bg-[#FF5F1F]/10 text-[#FF5F1F] border border-[#FF5F1F]/30' : 'text-gray-400 border border-white/5 hover:text-white'
                    }`}
                  >
                    <Shield size={20} /> DEFEND
                  </button>
                  <button
                    onClick={() => { handleLeaderboardClick(); setIsMobileMenuOpen(false); }}
                    className={`flex items-center justify-center gap-3 px-4 py-4 font-bold text-lg transition-all w-full rounded-lg ${
                      isLeaderboard ? 'bg-neonPink/10 text-neonPink border border-neonPink/30' : 'text-gray-400 border border-white/5 hover:text-white'
                    }`}
                  >
                    <Trophy size={20} /> LEADERBOARD
                  </button>
                  {showAdminTab && (
                    <button
                      onClick={() => { handleAdminClick(); setIsMobileMenuOpen(false); }}
                      className={`flex items-center justify-center gap-3 px-4 py-4 font-bold text-lg transition-all w-full rounded-lg ${
                        isAdmin ? 'bg-neonGreen/10 text-neonGreen border border-neonGreen/30' : 'text-gray-400 border border-white/5 hover:text-white'
                      }`}
                    >
                      <Shield size={20} /> ADMIN
                    </button>
                  )}

                  {/* Connect Wallet Button inside Mobile Menu if not connected */}
                  {!connected && (
                    <button
                      onClick={() => {
                        openConnectModal();
                        setIsMobileMenuOpen(false);
                      }}
                      type="button"
                      className="btn-neon flex items-center justify-center gap-2 text-lg py-4 w-full mt-4"
                    >
                      <Wallet size={20} /> Connect Wallet
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default TopNav;
