const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying StrikeGraphStore with the account:", deployer.address);

  const StrikeGraphStore = await hre.ethers.getContractFactory("StrikeGraphStore");
  console.log("Deploying contract...");
  const store = await StrikeGraphStore.deploy();

  await store.waitForDeployment();
  const address = await store.getAddress();

  console.log("StrikeGraphStore successfully deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
