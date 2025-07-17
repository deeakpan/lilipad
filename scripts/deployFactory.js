const hre = require("hardhat");

async function main() {
  const platform = "0x7e217fa1Ce282653115bA04686aE73dd689Ee588";
  const initialLaunchFee = 3; // 3 pepu
  const platformFeeBps = 500;

  const Factory = await hre.ethers.getContractFactory("LaunchpadFactory");
  const factory = await Factory.deploy(platform, initialLaunchFee, platformFeeBps);
  await factory.waitForDeployment();
  console.log("LaunchpadFactory deployed to:", await factory.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 