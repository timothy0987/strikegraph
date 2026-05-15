# StrikeGraph | Web3 Penalty Kick Game

**Live URL:** [https://strikegraph-ai.vercel.app](https://strikegraph-ai.vercel.app)

StrikeGraph is a Web3-integrated 3D penalty kick football game built with React, React Three Fiber, and Wagmi. It features a vibrant, high-contrast arcade aesthetic and integrates with the Hedera Testnet for a seamless blockchain experience.

## Features
- **3D Gameplay**: Realistic ball physics and AI goalkeeper logic powered by React Three Fiber.
- **Web3 Integration**: Universal wallet connection via RainbowKit and Wagmi.
- **Hedera Support**: Native support for Hedera Testnet (Chain ID: 296) with dynamic EVM-to-Native ID conversion using the Mirror Node API.
- **Transfer Market**: In-game economy allowing users to upgrade to premium kickers with enhanced stats.
- **Arcade Aesthetic**: Neon-drenched visuals and smooth animations.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS
- **3D Engine**: @react-three/fiber, @react-three/drei, Three.js
- **Web3**: Wagmi, Viem, RainbowKit, TanStack Query
- **Network**: Hedera Testnet

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/timothy0987/strikegraph.git
   ```
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
