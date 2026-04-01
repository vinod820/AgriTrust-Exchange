require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const AMOY_RPC_URL = process.env.AMOY_RPC_URL;

const networks = {
  hardhat: {},
  localhost: {
    url: "http://127.0.0.1:8545"
  }
};

if (PRIVATE_KEY && AMOY_RPC_URL) {
  networks.amoy = {
    url: AMOY_RPC_URL,
    accounts: [PRIVATE_KEY]
  };
}

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks
};
