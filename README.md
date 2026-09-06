# Golazo | Web3 Penalty Kick Game

**Live URL:** [https://strikegraph-ai.xyz](https://strikegraph-ai.xyz)

Golazo is a Web3-integrated 3D penalty kick football game built with React, React Three Fiber, and Wagmi. It features a vibrant, high-contrast arcade aesthetic and runs on **X1 EcoChain** — an EVM-compatible Layer-1 secured by Proof of Nodes (PoN).

> Formerly "StrikeGraph" (a Hedera hashgraph pun); renamed after migrating to X1 EcoChain. The on-chain contract keeps the name `StrikeGraphStore`.

## Features
- **3D Gameplay**: Realistic ball physics and AI goalkeeper logic powered by React Three Fiber.
- **Web3 Integration**: Universal wallet connection via RainbowKit and Wagmi (MetaMask, Rainbow, WalletConnect, injected).
- **X1 EcoChain**: Stake, play, and buy player variants on the X1 EcoChain Maculatus Testnet (Chain ID: 10778). The on-chain leaderboard is aggregated live from the Blockscout explorer API.
- **Transfer Market**: In-game economy allowing users to upgrade to premium kickers with enhanced stats.
- **Arcade Aesthetic**: Neon-drenched visuals and smooth animations.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS
- **3D Engine**: @react-three/fiber, @react-three/drei, Three.js
- **Web3**: Wagmi, Viem, RainbowKit, TanStack Query
- **Contracts**: Solidity 0.8.20, Hardhat
- **Network**: X1 EcoChain — Maculatus Testnet

## X1 EcoChain — Maculatus Testnet

| Setting | Value |
| --- | --- |
| Chain ID | `10778` |
| RPC URL | `https://maculatus-rpc.x1eco.com` |
| Currency symbol | `X1T` (18 decimals) |
| Block explorer | `https://maculatus-scan.x1eco.com` (Blockscout) |
| Faucet | X1 EcoChain Discord — `/faucet <address>` in `#faucet` (100 X1T / 24h, balance must be < 500 X1T) |
| StrikeGraphStore | [`0x9abdEa3C7Ad6Db0C41802f2B59e8045B0B277dA2`](https://maculatus-scan.x1eco.com/address/0x9abdEa3C7Ad6Db0C41802f2B59e8045B0B277dA2#code) (verified) |

## Smart contract (`/web3`)

```bash
cd web3
cp .env.example .env          # add PRIVATE_KEY of a faucet-funded wallet
npm install
npm run compile
npm run deploy                # deploys StrikeGraphStore to x1Testnet
```

After deployment, set `STRIKEGRAPH_STORE_ADDRESS` in [`src/config/contract.js`](src/config/contract.js) to the printed address, then fund the contract so it can pay out 2x wins (`fundContract()` is `onlyOwner` and `payable`). Verify with `npx hardhat verify --network x1Testnet <address>`.

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/timothy0987/strikegraph.git
   ```
   <!-- repo rename to /golazo pending; GitHub keeps the old URL working via redirect -->

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### Deployment
The project is configured for automated deployment to Vercel upon pushing to the `main` branch.
