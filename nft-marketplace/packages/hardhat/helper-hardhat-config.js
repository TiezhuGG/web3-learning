const networkConfig = {
  31337: {
    name: "hardhat",
    mintFee: "10000000000000000", // 0.01 ETH
  },
  11155111: {
    name: "sepolia",
    mintFee: "10000000000000000", // 0.01 ETH
    vrfCoordinatorV2_5: "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B",
    subscriptionId:
      "38544365722410335914644859367721158417987081726933582581299551267952028378010",
    blockConfirmations: 6,
  },
};

const developmentChains = ["hardhat", "localhost"];

module.exports = {
  networkConfig,
  developmentChains,
};
