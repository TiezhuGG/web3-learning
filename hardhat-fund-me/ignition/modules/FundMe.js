const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("FundMe", (m) => {
  const priceFeed = m.getParameter(
    "priceFeed",
    "0x694AA1769357215DE4FAC081bf1f309aDC325306"
  );

  const fundMe = m.contract("FundMe", [priceFeed]);

  return { fundMe };
});
