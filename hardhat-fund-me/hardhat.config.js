require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();
require("hardhat-deploy"); 
// require("hardhat-gas-reporter");

/** @type import('hardhat/config').HardhatUserConfig */

const SEPOLIA_URL = `${process.env.ALCHEMY_SEPOLIA_RPC_URL}/${process.env.ALCHEMY_KEY}`;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY;

module.exports = {
  solidity: "0.8.28",
  defaultNetwork: "hardhat",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    sepolia: {
      url: SEPOLIA_URL,
      chainId: 11155111,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_KEY,
  },
  sourcify: {
    enabled: true,
  },
  // gasReporter: {
  //   enabled: false,
  //   outputFile: "gas-report.txt",
  //   noColors: true,
  //   currency: "USD",
  // },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    user: {
      default: 1,
    },
  },
};
