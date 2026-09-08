# Golazo | Web3 Penalty Kick Game

**Live URL:** [https://strikegraph-ai.xyz](https://strikegraph-ai.xyz)

Golazo is a Web3-integrated 3D penalty kick football game built with React, React Three Fiber, and Wagmi. It features a vibrant, high-contrast arcade aesthetic and runs on **X1 EcoChain** — an EVM-compatible Layer-1 secured by Proof of Nodes (PoN).

> Formerly "StrikeGraph" (a Hedera hashgraph pun); renamed after migrating to X1 EcoChain.

## Features
- **Provably-fair outcomes (commit / reveal)** — the client never decides goal or save:
  1. You pick a corner; `keccak256(zone, salt, you)` is committed on-chain — your choice stays hidden.
  2. The keeper's dive is derived on-chain from `blockhash(commitBlock + 1)` — a value that did not exist when you committed and can never change afterwards.
  3. You reveal `zone + salt`; **the contract** checks the hash, computes GOAL / SAVED, and pays 2× on a goal. No server, no oracle.
- **Player variants are real ERC-721s** (`Golazo Player` / `GOLP`) with fully on-chain metadata + SVG art. A higher tier makes the keeper cover fewer of the 6 corners (Base/Striker 3, Sniper 2, Legend 1 → a provably-fair 50/50 at Base).
- **Everything on-chain**: the leaderboard is aggregated live from `ShotResolved` events; each result screen shows the real gas cost (~0.0001 X1T for commit + reveal) and links the reveal transaction.
- **3D Gameplay**: ball physics + animated keeper via React Three Fiber; kicker/keeper wear kits (variant-coloured).
- **Wallets**: RainbowKit + Wagmi (MetaMask, Rainbow, WalletConnect, injected).

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS
- **3D Engine**: @react-three/fiber, @react-three/drei, Three.js
- **Web3**: Wagmi, Viem, RainbowKit, TanStack Query
- **Contracts**: Solidity 0.8.20 (optimizer + viaIR), Hardhat, OpenZeppelin ERC-721
- **Network**: X1 EcoChain — Maculatus Testnet

## X1 EcoChain — Maculatus Testnet

| Setting | Value |
| --- | --- |
| Chain ID | `10778` |
| RPC URL | `https://maculatus-rpc.x1eco.com` |
| Currency symbol | `X1T` (18 decimals) |
| Block explorer | `https://maculatus-scan.x1eco.com` (Blockscout) |
| Faucet | X1 EcoChain Discord — `/faucet <address>` in `#faucet` (100 X1T / 24h, balance must be < 500 X1T) |
| `GolazoArena` | [`0x5935513952Dd6C3D22A8993967C3cF026ed678C2`](https://maculatus-scan.x1eco.com/address/0x5935513952Dd6C3D22A8993967C3cF026ed678C2#code) (verified) |

## Smart contract (`/web3`)

```bash
cd web3
cp .env.example .env          # add PRIVATE_KEY of a faucet-funded wallet
npm install
npm test                      # 11 tests — commit/reveal, ERC-721, expiry, liquidity
npm run deploy                # deploys GolazoArena to x1Testnet
```

After deployment, set `GOLAZO_ARENA_ADDRESS` in [`src/config/contract.js`](src/config/contract.js) to the printed address, then fund payout liquidity (`fundContract()` is `onlyOwner` + `payable`). Verify with `npx hardhat verify --network x1Testnet <address>`.

### Contract surface

| Function | Purpose |
| --- | --- |
| `commitShot(bytes32)` payable | stake + submit the hidden shot commitment |
| `revealShot(uint8 zone, bytes32 salt)` | reveal; contract settles GOAL/SAVED and pays out |
| `expireCommit(address)` | anyone sweeps an unrevealed stake to treasury after ~240 blocks |
| `buyPlayerVariant(uint8 tier)` payable | mint a `Golazo Player` ERC-721 (tier 1/2/3 = 5/10/25 X1T) |
| `highestTier(address) → uint8` | best variant held (drives keeper coverage) |
| `keeperCover(uint8 tier) → uint8` | corners the keeper covers (3 / 3 / 2 / 1) |

## Play-test results (X1 EcoChain — Maculatus, 2026-09-08)

`GolazoArena` at [`0x5935…78C2`](https://maculatus-scan.x1eco.com/address/0x5935513952Dd6C3D22A8993967C3cF026ed678C2), deployed + verified, funded 24 X1T.

- **11 / 11 Hardhat tests pass** (`cd web3 && npm test`): commit/reveal happy paths + reverts (too-early, bad salt, wrong zone), keeper-mask bit-count per tier, `expireCommit` sweep, self-heal on stale match, ERC-721 mint / `highestTier` / transfer, owner-only liquidity.
- **Live end-to-end** — a 3-round run of the exact `playPenalty()` sequence (`commitShot` → wait for `blockhash(commitBlock+1)` → `revealShot` → parse `ShotResolved`):

  | Round | Shot | Keeper covered | Result | Match gas |
  | --- | --- | --- | --- | --- |
  | 1 | bottom-R | bottom-L, bottom-R, top-L | **SAVED** — stake → treasury | 0.000115 X1T |
  | 2 | top-C | bottom-L, top-L, top-R | **GOAL** — 1.0 X1T paid (2× the 0.5 stake) | 0.000112 X1T |
  | 3 | bottom-L | bottom-L, bottom-C, top-L | **SAVED** — stake → treasury | 0.000115 X1T |

  Keeper covered exactly **3 of 6** corners each round (`keeperCover(1) = 3`, Striker held). Balances reconciled every round; match state cleared after each reveal. **~$0.0001-worth of gas per full match.**

- **Browser flow, real wallets** — beyond the scripted run, Blockscout has indexed **7 settled matches** on the contract; **3 of them (1 goal, 2 saves) came from wallet sessions on [strikegraph-ai.xyz](https://strikegraph-ai.xyz)** — i.e. the in-browser commit → reveal (two MetaMask prompts) works in production. The leaderboard and the per-wallet record panel read these `ShotResolved` / `VariantMinted` logs live via the Blockscout API.

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
