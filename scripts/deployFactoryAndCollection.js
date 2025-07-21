// scripts/deployFactoryAndCollection.js
// Usage:
// npx hardhat run scripts/deployFactoryAndCollection.js --network <network>

const hre = require("hardhat");
const { ethers } = hre;

// Hardcoded deploy parameters
const LAUNCH_FEE = BigInt("3000000000000000000");
const PLATFORM_FEE_BPS = BigInt("500");
const WITHDRAW_MANAGER = "0x17CaBc8001a30800835DD8206CEB0c4bA90B5913";

async function main() {
  const [deployer] = await ethers.getSigners();
  const Factory = await ethers.getContractFactory("LaunchpadFactory", deployer);
  const factory = await Factory.deploy(LAUNCH_FEE, PLATFORM_FEE_BPS, WITHDRAW_MANAGER);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("========== LaunchpadFactory Deployment ==========");
  process.stdout.write("");
  console.log("LaunchpadFactory deployed to:", factoryAddress);
  process.stdout.write("");
  console.log("Launch Fee:", LAUNCH_FEE.toString());
  process.stdout.write("");
  console.log("Platform Fee BPS:", PLATFORM_FEE_BPS.toString());
  process.stdout.write("");
  console.log("Withdraw Manager:", WITHDRAW_MANAGER);
  process.stdout.write("");
  console.log("Contract address:", factoryAddress);
  process.stdout.write("");
  console.log("===============================================");
  process.stdout.write("");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 