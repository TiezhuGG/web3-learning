const { readFileSync, writeFileSync, mkdirSync } = require("fs");
const { network } = require("hardhat");
const path = require("path");
require("dotenv").config();

// 常量路径配置
const FRONTEND_CONSTANTS_PATH = path.join(
  __dirname,
  "../../nextjs/src/constants"
);
const DEPLOYMENTS_PATH = path.join(__dirname, "../deployments");

function getTargetNetwork() {
  return network.name === "hardhat" ? "localhost" : network.name;
}

module.exports = async function () {
  if (process.env.UPDATE_FRONT_END === "true") {
    // 确保目录存在
    mkdirSync(FRONTEND_CONSTANTS_PATH, { recursive: true });

    // 获取当前网络部署信息
    const networkName = getTargetNetwork();
    const deploymentPath = path.join(DEPLOYMENTS_PATH, networkName);

    // 遍历所有部署的合约
    const contracts = ["RandomIpfsNft", "NftMarketplace"]; // 添加需要同步的合约名称

    contracts.forEach((contractName) => {
      // 读取部署结果
      const contractJson = JSON.parse(
        readFileSync(path.join(deploymentPath, `${contractName}.json`), "utf8")
      );

      // 生成前端常量文件内容
      const fileContent = `export const ${contractName.toUpperCase()}_CONTRACT_ADDRESS = "${
        contractJson.address
      }"; 
      export const ${contractName.toUpperCase()}_ABI = ${JSON.stringify(
        contractJson.abi,
        null,
        2
      )} as const;
`;

      // 写入文件
      writeFileSync(
        path.join(FRONTEND_CONSTANTS_PATH, `${contractName}.ts`),
        fileContent
      );
    });

    console.log("合约信息已同步到前端目录");
  }
};

module.exports.tags = ["all", "frontend"];
