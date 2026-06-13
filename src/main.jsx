import { Buffer } from 'buffer';
window.Buffer = window.Buffer || Buffer;
import '@rainbow-me/rainbowkit/styles.css';

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { getDefaultConfig, RainbowKitProvider, darkTheme, getWalletConnectConnector } from '@rainbow-me/rainbowkit';
import { metaMaskWallet, rainbowWallet, walletConnectWallet } from '@rainbow-me/rainbowkit/wallets';
import { WagmiProvider, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const hederaTestnet = {
  id: 296,
  name: 'Hedera Testnet',
  network: 'hedera-testnet',
  nativeCurrency: { decimals: 18, name: 'HBAR', symbol: 'HBAR' },
  rpcUrls: {
    default: { http: ['https://testnet.hashio.io/api'] },
    public: { http: ['https://testnet.hashio.io/api'] },
  },
  blockExplorers: {
    default: { name: 'HashScan', url: 'https://hashscan.io/testnet' },
  },
  testnet: true,
};

const hashpackWallet = ({ projectId }) => ({
  id: 'hashpack',
  name: 'HashPack',
  iconUrl: 'https://www.hashpack.app/favicon.ico',
  iconBackground: '#0b1d3a',
  downloadUrls: {
    chrome: 'https://chrome.google.com/webstore/detail/hashpack/jggofhoiebckgbifbhahahbgedhcphfo',
    android: 'https://play.google.com/store/apps/details?id=app.hashpack.wallet',
    ios: 'https://apps.apple.com/us/app/hashpack-wallet/id1612848553',
  },
  createConnector: getWalletConnectConnector({
    projectId,
  }),
});

const wallets = [
  {
    groupName: 'Recommended',
    wallets: [
      hashpackWallet,
      metaMaskWallet,
      rainbowWallet,
      walletConnectWallet,
    ],
  },
];

const config = getDefaultConfig({
  appName: 'StrikeGraph',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [hederaTestnet],
  transports: {
    [hederaTestnet.id]: http(),
  },
  wallets,
});

const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)
