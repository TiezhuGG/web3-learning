import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "dotenv/config";
import "hardhat-deploy";

const SEPOLIA_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY_1 = process.env.PRIVATE_KEY_1!;
const PRIVATE_KEY_2 = process.env.PRIVATE_KEY_2!;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

const config: HardhatUserConfig = {
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
    // sepolia: {
    //   url: SEPOLIA_URL,
    //   chainId: 11155111,
    //   accounts: [PRIVATE_KEY_2, PRIVATE_KEY_1],
    // },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  sourcify: {
    enabled: true,
  },
};

export default config;
