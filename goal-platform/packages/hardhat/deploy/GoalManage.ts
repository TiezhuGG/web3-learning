import { HardhatRuntimeEnvironment } from "hardhat/types";

export default async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying GoalManage...");

  const goalManage = await deploy("GoalManage", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });
  console.log(
    "GoalManage deployed at:",
    goalManage.address,
    "by",
    deployer,
    "on",
    hre.network.name,
    "network"
  );
}
