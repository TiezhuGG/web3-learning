const { verify } = require("../utils/verify");
const { developmentChains } = require("../helper-hardhat-config");
const { network } = require("hardhat");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deployer } = await getNamedAccounts();
  const { deploy, log } = deployments;

  log("Deploying BasicNft...");

  const basicNft = await deploy("BasicNft", {
    from: deployer,
    args: [],
    log: true,
  });

  log("BasicNft deployed to:", basicNft.address);

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log("Verifying...");
    await verify(basicNft.address);
  }
};

module.exports.tags = ["all", "basicNft"];
