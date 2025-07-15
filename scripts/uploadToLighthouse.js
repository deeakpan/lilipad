// scripts/uploadToLighthouse.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const lighthouse = require('@lighthouse-web3/sdk');

const API_KEY = process.env.LIGHTHOUSE_API_KEY;
if (!API_KEY) {
  console.error('LIGHTHOUSE_API_KEY not found in .env');
  process.exit(1);
}

async function uploadFile(filePath) {
  const response = await lighthouse.upload(filePath, API_KEY);
  return response.data.Hash;
}

async function uploadText(text, name) {
  const response = await lighthouse.uploadText(text, API_KEY, name);
  return response.data.Hash;
}

async function main() {
  // 1. Upload collection image
  const collectionImagePath = path.join(__dirname, '../images/collection.png');
  const collectionImageCid = await uploadFile(collectionImagePath);
  console.log('Collection image CID:', collectionImageCid);

  // 2. Upload NFT images
  const imageDir = path.join(__dirname, '../images');
  const imageFiles = fs.readdirSync(imageDir).filter(f => f.match(/^\d+\.png$/));
  const imageCids = {};
  for (const file of imageFiles) {
    const cid = await uploadFile(path.join(imageDir, file));
    imageCids[file] = `ipfs://${cid}`;
    console.log(`Uploaded ${file}: ${cid}`);
  }

  // 3. Update NFT metadata
  const metadataDir = path.join(__dirname, '../metadata');
  const metadataFiles = fs.readdirSync(metadataDir).filter(f => f.match(/^\d+\.json$/));
  const updatedMetadataCids = {};
  for (const file of metadataFiles) {
    const filePath = path.join(metadataDir, file);
    const json = JSON.parse(fs.readFileSync(filePath));
    const imgFile = file.replace('.json', '.png');
    json.image = imageCids[imgFile];
    json.collection = {
      name: 'Your Collection Name',
      description: 'Your collection description',
      image: `ipfs://${collectionImageCid}`
    };
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
    // 4. Upload updated metadata
    const cid = await uploadText(JSON.stringify(json), file);
    updatedMetadataCids[file] = `ipfs://${cid}`;
    console.log(`Uploaded metadata ${file}: ${cid}`);
  }

  // 5. Upload collection metadata
  const collectionMetadata = {
    name: 'Your Collection Name',
    description: 'Your collection description',
    image: `ipfs://${collectionImageCid}`
  };
  const collectionMetadataCid = await uploadText(JSON.stringify(collectionMetadata), 'collection.json');
  console.log('Collection metadata CID:', collectionMetadataCid);

  // 6. Output summary
  console.log('\n--- Upload Summary ---');
  console.log('Collection image CID:', collectionImageCid);
  console.log('Collection metadata CID:', collectionMetadataCid);
  console.log('NFT image CIDs:', imageCids);
  console.log('NFT metadata CIDs:', updatedMetadataCids);
}

main().catch(console.error); 