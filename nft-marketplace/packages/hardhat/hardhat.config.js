require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  namedAccounts: {
    deployer: {
      default: 0, // 第一个账户作为部署者
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
  },
};
