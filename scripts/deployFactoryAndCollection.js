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
  const Factory = await ethers.getContractFactory("LiliPadFactory", deployer);
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

  // --- Sample collection deployment for event verification ---
  // Replace these with real values as needed
  const sampleArgs = [
    "Test Collection", // name
    "TEST", // symbol
    "ipfs://baseURI/", // baseURI
    "ipfs://collectionURI/", // collectionURI
    10, // maxSupply
    ethers.parseEther("1"), // mintPrice
    500, // royaltyBps
    deployer.address, // royaltyRecipient
    Math.floor(Date.now() / 1000) + 60, // mintStart (now + 1 min)
    Math.floor(Date.now() / 1000) + 3600, // mintEnd (now + 1 hour)
    "test-vanity", // vanity
    ethers.ZeroAddress, // customMintToken
    ethers.parseUnits("0", 18) // customMintPrice
  ];
  const tx = await factory.deployCollection(...sampleArgs, { value: ethers.parseEther("3.5") });
  const receipt = await tx.wait();

  // Listen for CollectionDeployedMain
  const mainEvent = receipt.logs
    .map(log => {
      try { return factory.interface.parseLog(log); } catch { return null; }
    })
    .find(parsed => parsed && parsed.name === 'CollectionDeployedMain');
  if (mainEvent) {
    console.log('CollectionDeployedMain:', mainEvent.args);
  }

  // Listen for CollectionDeployedDetails (with new fields)
  const detailsEvent = receipt.logs
    .map(log => {
      try { return factory.interface.parseLog(log); } catch { return null; }
    })
    .find(parsed => parsed && parsed.name === 'CollectionDeployedDetails');
  if (detailsEvent) {
    console.log('CollectionDeployedDetails:', detailsEvent.args);
    console.log('customMintToken:', detailsEvent.args.customMintToken);
    console.log('customMintPrice:', detailsEvent.args.customMintPrice.toString());
    console.log('discountBps:', detailsEvent.args.discountBps.toString());
    console.log('finalFeePaid:', detailsEvent.args.finalFeePaid.toString());
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 