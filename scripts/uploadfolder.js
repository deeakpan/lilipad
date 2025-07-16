require('dotenv').config();
const lighthouse = require('@lighthouse-web3/sdk');

// Set the absolute path to your folder here. Example:
// const folderPath = 'C:/Users/User/Downloads/lili test-collection/metadata';
const folderPath = 'C:/Users/User/Downloads/lili test-collection/metadata'; // <-- Update this to your folder's absolute path
const apiKey = process.env.LIGHTHOUSE_API_KEY;

if (!apiKey) {
  console.error('LIGHTHOUSE_API_KEY not found in .env file');
  process.exit(1);
}

async function uploadFolder() {
  try {
    const response = await lighthouse.upload(folderPath, apiKey);
    console.log('Upload successful!');
    console.log('Folder CID:', response.data.Hash);
    console.log('View at:', `https://gateway.lighthouse.storage/ipfs/${response.data.Hash}`);
  } catch (err) {
    console.error('Upload failed:', err);
  }
}

uploadFolder();