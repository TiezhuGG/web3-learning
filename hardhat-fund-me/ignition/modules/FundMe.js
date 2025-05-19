const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("FundMe", (m) => {
  const priceFeed = m.getParameter(
    "priceFeed",
    // 默认使用本地模拟预言机
    network.config.chainId === 31337
      ? "0x5FbDB2315678afecb367f032d93F642f64180aa3"
      : "0x694AA1769357215DE4FAC081bf1f309aDC325306"
  );

  // 部署模拟预言机（仅当chainId=31337时生效）
  const mockAggregator = m.contract("MockV3Aggregator", [8, 2000e8], {
    id: "MockV3Aggregator",
    condition: (hre) => hre.network.config.chainId === 31337,
  });
  const finalPriceFeed = mockAggregator || priceFeed;

  const fundMe = m.contract("FundMe", [finalPriceFeed]);

  return { fundMe };
});
