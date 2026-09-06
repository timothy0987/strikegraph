import { Buffer } from 'buffer';
window.Buffer = window.Buffer || Buffer;
import '@rainbow-me/rainbowkit/styles.css';

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { metaMaskWallet, rainbowWallet, walletConnectWallet, injectedWallet } from '@rainbow-me/rainbowkit/wallets';
import { WagmiProvider, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// X1 EcoChain — Maculatus Testnet
// Docs: https://x1ecochain.gitbook.io/x1-ecochain-tech-whitepaper/development-environment/testnet
export const x1Testnet = {
  id: 10778,
  name: 'X1 EcoChain Testnet',
  network: 'x1-maculatus-testnet',
  nativeCurrency: { decimals: 18, name: 'X1T', symbol: 'X1T' },
  rpcUrls: {
    default: { http: ['https://maculatus-rpc.x1eco.com'] },
    public: { http: ['https://maculatus-rpc.x1eco.com'] },
  },
  blockExplorers: {
    default: { name: 'X1 Explorer', url: 'https://maculatus-scan.x1eco.com' },
  },
  testnet: true,
};

const wallets = [
  {
    groupName: 'Recommended',
    wallets: [
      metaMaskWallet,
      rainbowWallet,
      walletConnectWallet,
      injectedWallet,
    ],
  },
];

const config = getDefaultConfig({
  appName: 'StrikeGraph',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [x1Testnet],
  transports: {
    [x1Testnet.id]: http('https://maculatus-rpc.x1eco.com'),
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
