// scripts/verifycollection.js
// Usage: node scripts/verifycollection.js
require('dotenv').config();
const { ethers } = require('ethers');
const factoryABI = require('../src/abi/LiliPadFactory.json').abi;
const { execSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS;
const RPC_URL = 'https://rpc-pepu-v2-testnet-vn4qxxp9og.t.conduit.xyz';
const supabaseUrl = 'https://fidibsatkkwkxbqohudm.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

if (!FACTORY_ADDRESS) {
  console.error('NEXT_PUBLIC_FACTORY_ADDRESS not set in .env');
  process.exit(1);
}

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const factory = new ethers.Contract(FACTORY_ADDRESS, factoryABI, provider);

  console.log('Listening for collection creation events on:', FACTORY_ADDRESS);

  // Get all past events
  const mainEvents = await factory.queryFilter('CollectionDeployedMain');
  const detailsEvents = await factory.queryFilter('CollectionDeployedDetails');

  // Map details by collection address for easy lookup
  const detailsByCollection = {};
  for (const ev of detailsEvents) {
    detailsByCollection[ev.args.collection.toLowerCase()] = ev.args;
  }

  for (const ev of mainEvents) {
    const { collection, owner, vanity } = ev.args;
    const details = detailsByCollection[collection.toLowerCase()];
    console.log('---');
    console.log('Collection:', collection);
    console.log('Owner:', owner);
    console.log('Vanity:', vanity);
    if (details) {
      console.log('Name:', details.name);
      console.log('Symbol:', details.symbol);
      console.log('BaseURI:', details.baseURI);
      console.log('CollectionURI:', details.collectionURI);
      console.log('MaxSupply:', details.maxSupply.toString());
      console.log('MintPrice:', details.mintPrice.toString());
      console.log('RoyaltyBps:', details.royaltyBps.toString());
      console.log('RoyaltyRecipient:', details.royaltyRecipient);
      console.log('MintStart:', details.mintStart.toString());
      console.log('MintEnd:', details.mintEnd.toString());
      // Check if collection already exists in Supabase
      const { data: existing, error: readError } = await supabase
        .from('lilipad marketplace collections')
        .select('address')
        .eq('address', collection);
      if (readError) {
        console.error('Supabase read error:', readError.message);
      }
      if (existing && existing.length > 0) {
        console.log('Collection already exists on lilipad db, skipping:', collection);
        continue;
      }
      // Attempt to verify the collection contract
      try {
        const verifyCmd = `npx hardhat verify --network pepu-v2-testnet-vn4qxxp9og ${collection} "${details.name}" "${details.symbol}" "${details.baseURI}" "${details.collectionURI}" ${details.maxSupply} ${details.mintPrice} ${details.royaltyBps} ${details.royaltyRecipient} ${details.mintStart} ${details.mintEnd} ${owner}`;
        console.log('Verifying collection contract with:');
        console.log(verifyCmd);
        const output = execSync(verifyCmd, { stdio: 'inherit' });
        // After successful verification, upload to Supabase
        const { error } = await supabase.from('lilipad marketplace collections').insert([
          {
            address: collection,
            'vanity url': vanity,
            metadata_url: details.baseURI,
            collection_url: details.collectionURI
          }
        ]);
        if (error) {
          console.error('Supabase upload error:', error.message);
        } else {
          console.log('Collection details uploaded to Supabase.');
        }
      } catch (err) {
        console.error('Verification failed:', err.message);
      }
    } else {
      console.log('No details event found for this collection.');
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}); 