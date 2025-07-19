// scripts/deployFactoryAndCollection.js
// Usage:
// To deploy factory only:
//   node scripts/deployFactoryAndCollection.js --factory deploy --platform <platformAddress> --launchFee <launchFeeInWei> --platformFeeBps <platformFeeBps>
// To deploy a collection via an existing factory:
//   node scripts/deployFactoryAndCollection.js --factory <factoryAddress> --name ... --symbol ... (all collection args)

const hre = require("hardhat");
const { ethers } = hre;

// Set the network to use
hre.config.networks['pepu-v2-testnet-vn4qxxp9og'] = {
  url: 'https://rpc-pepu-v2-testnet-vn4qxxp9og.t.conduit.xyz',
  accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
};

const argv = require('minimist')(process.argv.slice(2), {
  string: ['platform', 'factory'] // Force these to be strings
});

function toUnixTimestamp(dateStr) {
  if (/^\d+$/.test(dateStr)) return parseInt(dateStr);
  return Math.floor(new Date(dateStr).getTime() / 1000);
}

async function main() {
  // Connect to the specific network
  const provider = new ethers.JsonRpcProvider('https://rpc-pepu-v2-testnet-vn4qxxp9og.t.conduit.xyz');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  let factoryAddress = argv.factory;
  let factory;

  if (!factoryAddress || factoryAddress === 'deploy') {
    // Deploy factory only
    if (!argv.launchFee || !argv.platformFeeBps) {
      throw new Error('Missing --launchFee or --platformFeeBps for factory deployment');
    }
    const launchFee = BigInt(argv.launchFee);
    const platformFeeBps = BigInt(argv.platformFeeBps);
    const Factory = await ethers.getContractFactory("LaunchpadFactory", wallet);
    factory = await Factory.deploy(launchFee, platformFeeBps);
    await factory.waitForDeployment();
    factoryAddress = await factory.getAddress();
    console.log("LaunchpadFactory deployed to:", factoryAddress);
    console.log("Launch Fee:", launchFee.toString());
    console.log("Platform Fee BPS:", platformFeeBps.toString());
    console.log("Done. To deploy a collection, rerun with --factory", factoryAddress, "and collection arguments.");

    return;
  }

  // Deploy collection via factory
  factory = await ethers.getContractAt("LaunchpadFactory", factoryAddress, wallet);
  console.log("Using existing LaunchpadFactory at:", factoryAddress);

  const required = [
    'name','symbol','baseURI','collectionURI','maxSupply','mintPrice','royaltyBps','royaltyRecipient','mintStart','mintEnd','vanity'
  ];
  for (const k of required) {
    if (!argv[k]) throw new Error(`Missing --${k}`);
  }
  const mintStart = toUnixTimestamp(argv.mintStart);
  const mintEnd = toUnixTimestamp(argv.mintEnd);
  if (mintEnd <= mintStart) throw new Error('mintEnd must be after mintStart');

  // Calculate total platform fee
  const totalPlatformFee = ethers.parseUnits(argv.launchFee || "0", 0)
    + (BigInt(argv.maxSupply) * BigInt(argv.mintPrice) * BigInt(argv.platformFeeBps || 0)) / 10000n;

  const tx = await factory.deployCollection(
    argv.name,
    argv.symbol,
    argv.baseURI,
    argv.collectionURI,
    argv.maxSupply,
    argv.mintPrice,
    argv.royaltyBps,
    argv.royaltyRecipient,
    mintStart,
    mintEnd,
    argv.vanity,
    { value: totalPlatformFee }
  );
  const receipt = await tx.wait();
  const event = receipt.events.find(e => e.event === 'CollectionDeployed');
  const collectionAddress = event ? event.args.collection : null;
  console.log("Collection deployed to:", collectionAddress);
  console.log("Collection Name:", argv.name);
  console.log("Symbol:", argv.symbol);
  console.log("Base URI:", argv.baseURI);
  console.log("Collection URI:", argv.collectionURI);
  console.log("Max Supply:", argv.maxSupply);
  console.log("Mint Price (wei):", argv.mintPrice);
  console.log("Royalty BPS:", argv.royaltyBps);
  console.log("Royalty Recipient:", argv.royaltyRecipient);
  console.log("Mint Window:", mintStart, "to", mintEnd);
  console.log("Vanity:", argv.vanity);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 