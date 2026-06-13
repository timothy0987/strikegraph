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

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '1ae92b26df02f0abca6304df07deb018';

const hashpackWallet = ({ projectId }) => ({
  id: 'hashpack',
  name: 'HashPack',
  iconUrl: 'https://www.hashpack.app/favicon.ico',
  iconBackground: '#fff',
  downloadUrls: {
    android: 'https://play.google.com/store/apps/details?id=app.hashpack.wallet',
    ios: 'https://apps.apple.com/us/app/hashpack/id1606857945',
    chrome: 'https://chrome.google.com/webstore/detail/hashpack/jggofmnebchlegcjeciahbcnailianoo',
    qrCode: 'https://www.hashpack.app/',
  },
  createConnector: getWalletConnectConnector({
    projectId,
  }),
});

const config = getDefaultConfig({
  appName: 'StrikeGraph',
  projectId,
  chains: [hederaTestnet],
  wallets: [
    {
      groupName: 'Popular',
      wallets: [
        hashpackWallet({ projectId }),
        metaMaskWallet({ projectId }),
        rainbowWallet({ projectId }),
        walletConnectWallet({ projectId }),
      ],
    },
  ],
  transports: {
    [hederaTestnet.id]: http(),
  },
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
