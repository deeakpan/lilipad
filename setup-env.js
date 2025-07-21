const fs = require('fs');
const path = require('path');

const envContent = `# Factory Contract Address (from your deployment)
NEXT_PUBLIC_FACTORY_ADDRESS=0xeF9033DAFd37f3b32bE31342ef5dEaE51dFd35ed

# Lighthouse API Key (get from https://lighthouse.storage/)
LIGHTHOUSE_API_KEY=your_lighthouse_api_key_here

# Wallet Private Key (for contract deployment)
PRIVATE_KEY=your_private_key_here

# WalletConnect Project ID (get from https://cloud.walletconnect.com/)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here`;

const envPath = path.join(__dirname, '.env.local');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local file with required environment variables');
  console.log('');
  console.log('📝 Please update the following environment variables:');
  console.log('');
  console.log('1. LIGHTHOUSE_API_KEY:');
  console.log('   - Go to https://lighthouse.storage/');
  console.log('   - Sign up/login and get your API key');
  console.log('   - Replace "your_lighthouse_api_key_here" with your actual key');
  console.log('');
  console.log('2. NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID:');
  console.log('   - Go to https://cloud.walletconnect.com/');
  console.log('   - Create a new project and get the Project ID');
  console.log('   - Replace "your_walletconnect_project_id_here" with your actual Project ID');
  console.log('');
  console.log('3. PRIVATE_KEY:');
  console.log('   - Add your wallet private key for contract deployment');
  console.log('   - Replace "your_private_key_here" with your actual private key');
  console.log('');
  console.log('⚠️  IMPORTANT: Never commit your .env.local file to git!');
  console.log('   It should already be in .gitignore, but double-check.');
} catch (error) {
  console.error('❌ Failed to create .env.local file:', error.message);
} 