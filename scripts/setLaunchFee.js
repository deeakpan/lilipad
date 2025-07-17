const hre = require("hardhat");

async function main() {
  // Replace with your deployed contract address
  const factoryAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  // Replace with your desired launch fee
  const newLaunchFee = 15000;

  // Get the contract factory and attach to deployed address
  const factory = await hre.ethers.getContractAt("LaunchpadFactory", factoryAddress);

  // Call setLaunchFee as the owner
  const tx = await factory.setLaunchFee(newLaunchFee);
  await tx.wait();

  console.log(`Launch fee set to ${newLaunchFee}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});