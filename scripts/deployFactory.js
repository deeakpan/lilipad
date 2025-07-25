const hre = require("hardhat");

async function main() {
  const platform = "0x7e217fa1Ce282653115bA04686aE73dd689Ee588";
  const initialLaunchFee = 3; // 3 pepu
  const platformFeeBps = 500;
  const stakingContract = process.env.NEXT_PUBLIC_STAKING_ADDRESS || "0x7F992b701376851554f9a01Cc6096f2cCC0c2A95"; // LiliPad Staking contract

  console.log("Deploying LiliPad Factory with Staking Integration...");
  console.log("Platform Address:", platform);
  console.log("Initial Launch Fee:", initialLaunchFee, "PEPU");
  console.log("Platform Fee BPS:", platformFeeBps);
  console.log("Staking Contract:", stakingContract);

  const Factory = await hre.ethers.getContractFactory("LiliPadFactory");
  const factory = await Factory.deploy(initialLaunchFee, platformFeeBps, platform, stakingContract);
  await factory.waitForDeployment();
  
  const factoryAddress = await factory.getAddress();
  console.log("LiliPadFactory deployed to:", factoryAddress);
  console.log("NEXT_PUBLIC_FACTORY_ADDRESS=" + factoryAddress);
  
  console.log("\n=== FACTORY FEATURES ===");
  console.log("✅ Tier-based launch fee discounts");
  console.log("✅ Custom ERC20 mint token support");
  console.log("✅ Staking integration for benefits");
  console.log("✅ Platform fee collection");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 