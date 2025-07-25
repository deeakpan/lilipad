// scripts/deployStaking.js
// Usage:
// node scripts/deployStaking.js
// This script deploys the LiliPadStaking contract using the LILI token (symbol: LILI)

const hre = require("hardhat");

async function main() {
  const liliTokenAddress = process.env.NEXT_PUBLIC_LILI_TOKEN_ADDRESS || "0xaFD224042abbd3c51B82C9f43B681014c12649ca"; // LILI token address

  console.log("Deploying LiliPad Staking contract (Multiple Stakes + History)...");
  console.log("LILI Token Address:", liliTokenAddress);

  const LiliPadStaking = await hre.ethers.getContractFactory("LiliPadStaking");
  const staking = await LiliPadStaking.deploy(liliTokenAddress);
  
  // Wait for deployment
  await staking.waitForDeployment();
  
  // Get the deployed address
  const stakingAddress = await staking.getAddress();
  console.log("LiliPad Staking deployed to:", stakingAddress);
  console.log("NEXT_PUBLIC_STAKING_ADDRESS=" + stakingAddress);
  
  console.log("\n=== NEW FEATURES ===");
  console.log("✅ Multiple stakes per user (one per tier)");
  console.log("✅ Stake history tracking");
  console.log("✅ Highest tier priority for discounts");
  console.log("✅ Frontend shows active stakes and history");
  
  console.log("\n=== TIER REQUIREMENTS ===");
  console.log("Sprout: 20,000 LILI for 5 minutes (testing) - 33.33% discount");
  console.log("Hopper: 30,000 LILI for 50 days - 40% discount");
  console.log("Guardian: 50,000 LILI for 60 days - 60% discount");
  
  console.log("\n=== BENEFITS ===");
  console.log("✅ All tiers can set custom ERC20 mint tokens");
  console.log("✅ Factory uses highest active tier for discounts");
  console.log("✅ Collection owners can withdraw ERC20 tokens");
  console.log("✅ Complete stake history visible in frontend");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 