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
- **Closed-pool economy**: every stake, every lost/forfeited stake and every NFT sale stays in one contract pool. At Base the pool is mathematically neutral (`E[Δpool] = ½·(+stake) + ½·(−stake) = 0`); higher tiers are a deliberate, pool-funded subsidy. `commitShot` caps a stake so the pool can always pay 2×; the owner tops up / withdraws surplus.
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
| `GolazoArena` | [`0xdd4973C245924739B38E5b8964CfAF90A17F5ca9`](https://maculatus-scan.x1eco.com/address/0xdd4973C245924739B38E5b8964CfAF90A17F5ca9#code) (verified) |

## Smart contract (`/web3`)

```bash
cd web3
cp .env.example .env          # add PRIVATE_KEY of a faucet-funded wallet
npm install
npm test                      # 12 tests — commit/reveal, stake cap, ERC-721, expiry, pool accounting
npm run deploy                # deploys GolazoArena to x1Testnet
```

After deployment, set `GOLAZO_ARENA_ADDRESS` in [`src/config/contract.js`](src/config/contract.js) to the printed address, then fund payout liquidity (`fundContract()` is `onlyOwner` + `payable`). Verify with `npx hardhat verify --network x1Testnet <address>`.

### Contract surface

| Function | Purpose |
| --- | --- |
| `commitShot(bytes32)` payable | stake + submit the hidden shot commitment; reverts if `2·stake > poolBalance` |
| `revealShot(uint8 zone, bytes32 salt)` | reveal; contract settles GOAL/SAVED — GOAL pays 2×, SAVED keeps the stake in the pool |
| `expireCommit(address)` | anyone clears an unrevealed match after ~240 blocks; the stake stays in the pool |
| `buyPlayerVariant(uint8 tier)` payable | mint a `Golazo Player` ERC-721 (tier 1/2/3 = 5/10/25 X1T); proceeds stay in the pool |
| `poolBalance() → uint256` | current payout pool (= contract balance) |
| `highestTier(address) → uint8` | best variant held (drives keeper coverage) |
| `keeperCover(uint8 tier) → uint8` | corners the keeper covers (3 / 3 / 2 / 1) |

## Play-test results (X1 EcoChain — Maculatus, 2026-09-08)

`GolazoArena` at [`0xdd49…5ca9`](https://maculatus-scan.x1eco.com/address/0xdd4973C245924739B38E5b8964CfAF90A17F5ca9#code), deployed + verified, pool funded 24 X1T.

- **12 / 12 Hardhat tests pass** (`cd web3 && npm test`): commit/reveal happy paths + reverts (too-early, bad salt, wrong zone), **stake-capacity cap**, keeper-mask bit-count per tier, `expireCommit` (stake retained), self-heal on stale match (stake retained), ERC-721 mint / `highestTier` / transfer, **pool accounting on GOAL vs SAVED**, owner-only withdraw.
- **Live end-to-end** — runs of the exact `playPenalty()` sequence (`commitShot` → wait for `blockhash(commitBlock+1)` → `revealShot` → parse `ShotResolved`) across two contract versions:

  | Shot | Keeper covered | Result | Match gas |
  | --- | --- | --- | --- |
  | bottom-R | bottom-L, bottom-R, top-L | **SAVED** — stake stays in pool | 0.000115 X1T |
  | top-C | bottom-L, top-L, top-R | **GOAL** — 1.0 X1T paid (2× the 0.5 stake) | 0.000112 X1T |
  | bottom-L | bottom-L, bottom-C, top-L | **SAVED** — stake stays in pool | 0.000115 X1T |
  | bottom-C | (Striker, 3/6) | **SAVED** — `poolBalance` 24.0 → 24.5, retained | 0.000110 X1T |

  On v3: a 13 X1T stake against a 24.5 X1T pool is **rejected** (`2·stake > pool`). Keeper covered exactly **3 of 6** corners each round (`keeperCover(1) = 3`). Match state cleared after every reveal. **~$0.0001-worth of gas per full match.**

- **Browser flow, real wallets** — Blockscout has indexed settled matches on the contracts that came from wallet sessions on [strikegraph-ai.xyz](https://strikegraph-ai.xyz), i.e. the in-browser commit → reveal (two MetaMask prompts) works in production. The leaderboard and per-wallet record panel read `ShotResolved` / `VariantMinted` logs live via the Blockscout API.

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
