const networkConfig = {
  31337: {
    name: "hardhat",
    mintFee: "10000000000000000", // 0.01 ETH
  },
  11155111: {
    name: "sepolia",
    mintFee: "10000000000000000", // 0.01 ETH
    vrfCoordinatorV2_5: "",
    subscriptionId: "",
    blockConfirmations: 6,
  },
};

const developmentChains = ["hardhat", "localhost"];

module.exports = {
  networkConfig,
  developmentChains,
};
