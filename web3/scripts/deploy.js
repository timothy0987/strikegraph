const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const net = await hre.ethers.provider.getNetwork();
  const balance = await hre.ethers.provider.getBalance(deployer.address);

  console.log(`Network:  ${hre.network.name} (chainId ${net.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance:  ${hre.ethers.formatEther(balance)} X1T`);

  const GolazoArena = await hre.ethers.getContractFactory("GolazoArena");
  console.log("Deploying GolazoArena...");
  const arena = await GolazoArena.deploy();
  await arena.waitForDeployment();
  const address = await arena.getAddress();

  console.log("\nGolazoArena deployed to:", address);
  console.log("Explorer: https://maculatus-scan.x1eco.com/address/" + address);
  console.log("\nNext steps:");
  console.log("  1. Set GOLAZO_ARENA_ADDRESS in src/config/contract.js to the address above.");
  console.log("  2. Fund payout liquidity:  arena.fundContract({ value: ... })");
  console.log(`  3. Verify:  npx hardhat verify --network x1Testnet ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
