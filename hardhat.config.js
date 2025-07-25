require('@nomicfoundation/hardhat-toolbox');
require('@nomicfoundation/hardhat-verify');
require('dotenv').config();

module.exports = {
  solidity: {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    'pepu-v2-testnet-vn4qxxp9og': {
      url: 'https://rpc-pepu-v2-testnet-vn4qxxp9og.t.conduit.xyz',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      'pepu-v2-testnet-vn4qxxp9og': 'empty'
    },
    customChains: [
      {
        network: "pepu-v2-testnet-vn4qxxp9og",
        chainId: 97740,
        urls: {
          apiURL: "https://explorer-pepu-v2-testnet-vn4qxxp9og.t.conduit.xyz/api",
          browserURL: "https://explorer-pepu-v2-testnet-vn4qxxp9og.t.conduit.xyz:443"
        }
      }
    ]
  }
}; 