const networkConfig = {
  31337: {
    name: "localhost",
    linkToken: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
    vrfWrapper: "0x195f15F2d49d693cE265b4fB0fdDbE15b1850Cc1",
    mintFee: "10000000000000000", // 0.01 ETH
  },
  11155111: {
    name: "sepolia",
    linkToken: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
    vrfWrapper: "0x195f15F2d49d693cE265b4fB0fdDbE15b1850Cc1",
    mintFee: "1000000000000000",
    blockConfirmations: 6,
  },
};

const developmentChains = ["hardhat", "localhost"];

module.exports = {
  networkConfig,
  developmentChains,
};
