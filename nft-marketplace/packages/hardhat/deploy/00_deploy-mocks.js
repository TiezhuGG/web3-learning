const { network } = require("hardhat");

const _BASEFEE = 100000000000000000n;
const _GASPRICELINK = 1000000000n;
const _WEIPERUNITLINK = 1000000000000000000n;

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  if (chainId === 31337) {
    log("Local network detected! Deploying mocks...");

    await deploy("VRFCoordinatorV2_5Mock", {
      from: deployer,
      args: [_BASEFEE, _GASPRICELINK, _WEIPERUNITLINK],
      log: true,
      waitConfirmations: 1,
    });
    
    log("Mocks Deployed!");
    log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    log(
      "You are deploying to a local network, you'll need a local network running to interact"
    );
    log(
      "Please run `yarn hardhat console --network localhost` to interact with the deployed smart contracts!"
    );
    log("----------------------------------------------------");
  }
};

module.exports.tags = ["all", "mocks"];
