// scripts/deploy.js
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  const SimpleToken = await ethers.getContractFactory('SimpleToken');
  const initialSupply = 1000000; // 1 million tokens
  const token = await SimpleToken.deploy(initialSupply);

  await token.waitForDeployment();
  console.log('SimpleToken token deployed to:', token.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 