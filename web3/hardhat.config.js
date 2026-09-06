require('dotenv').config();
require("@nomicfoundation/hardhat-toolbox");

// Some environments (and hardhat's bundled undici) hang on AAAA/IPv6 lookups for
// the X1 RPC host before falling back to IPv4. Force IPv4-first resolution.
require('node:dns').setDefaultResultOrder('ipv4first');

// X1 EcoChain — Maculatus Testnet
// Chain ID: 10778 | RPC: https://maculatus-rpc.x1eco.com | Explorer: https://maculatus-scan.x1eco.com
module.exports = {
  solidity: "0.8.20",
  networks: {
    x1Testnet: {
      url: process.env.X1_RPC_URL || "https://maculatus-rpc.x1eco.com",
      chainId: 10778,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },
  // Blockscout-compatible verification
  etherscan: {
    apiKey: {
      x1Testnet: "abc" // Blockscout ignores the key value but the field is required
    },
    customChains: [
      {
        network: "x1Testnet",
        chainId: 10778,
        urls: {
          apiURL: "https://maculatus-scan.x1eco.com/api",
          browserURL: "https://maculatus-scan.x1eco.com"
        }
      }
    ]
  },
  sourcify: {
    enabled: false
  }
};
