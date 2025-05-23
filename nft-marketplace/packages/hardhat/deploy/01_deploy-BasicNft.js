// 使用 hardhat-deploy 部署合约
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
};

module.exports.tags = ["all", "basicNft"];
