require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");
require("hardhat-gas-reporter");
require("hardhat-deploy");
require("dotenv").config();

const SEPOLIA_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY_1 = process.env.PRIVATE_KEY_1;
const PRIVATE_KEY_2 = process.env.PRIVATE_KEY_2;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    sepolia: {
      url: SEPOLIA_URL,
      chainId: 11155111,
      accounts: [PRIVATE_KEY_1, PRIVATE_KEY_2],
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  sourcify: {
    enabled: true,
  },
};
