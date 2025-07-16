// scripts/deploy.js
// Usage:
// node scripts/deploy.js "Collection Name" "SYMBOL" "ipfs://baseURI/" "0xCreatorAddress" 500

const hre = require("hardhat");

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 5) {
    console.error("Usage: node scripts/deploy.js \"Collection Name\" \"SYMBOL\" \"ipfs://baseURI/\" \"0xCreatorAddress\" royaltyBps");
    process.exit(1);
  }
  const [name, symbol, baseURI, royaltyRecipient, royaltyBpsStr] = args;
  const royaltyBps = parseInt(royaltyBpsStr);

  const Launchpad = await hre.ethers.getContractFactory("Launchpad");
  const launchpad = await Launchpad.deploy(name, symbol, baseURI, royaltyRecipient, royaltyBps);
  await launchpad.deployed();

  console.log("Launchpad deployed to:", launchpad.address);
  console.log("Collection Name:", name);
  console.log("Symbol:", symbol);
  console.log("Base URI:", baseURI);
  console.log("Royalty Recipient:", royaltyRecipient);
  console.log("Royalty BPS:", royaltyBps);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
  }); 