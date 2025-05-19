const { ethers } = require("hardhat");
require("dotenv").config();

const ENTRANCE_FEE = ethers.parseEther("0.001"); // 0.001 ETH

async function main() {
  // 获取部署者的账户
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);

  // 获取合约工厂
  const Raffle = await ethers.getContractFactory("Raffle");
  // 部署合约
  const deployedRaffle = await Raffle.deploy(ENTRANCE_FEE);
  console.log(`Raffle contract deployed to: ${deployedRaffle.target}`);

  await deployedRaffle.waitForDeployment();
  console.log("Raffle contract deployed successfully!", deployedRaffle.target);

  // 验证合约(当部署到sepolia测试网的时候需要验证合约)
  // if (network.config.chainId === 11155111 && process.env.ETHERSCAN_KEY) {
  //   await contractAddress.deploymentTransaction().wait(5);
  //   await verifyContract(deployedRaffle.target, [ENTRANCE_FEE]);
  // }
}

async function verifyContract(contractAddress, args) {
  console.log("Verifying contract...");

  await href.run("verify:verify", {
    address: contractAddress,
    constructorArguments: args,
  });
}

main()
  .then((_) => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
