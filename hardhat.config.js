require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

/** @type import('hardhat/config').HardhatConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    pepuTestnet: {
      url: "https://rpc-pepu-v2-testnet-vn4qxxp9og.t.conduit.xyz",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 97740,
    },
  },
};
