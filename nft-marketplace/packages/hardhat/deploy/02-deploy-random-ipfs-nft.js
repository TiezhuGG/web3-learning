const { network } = require("hardhat");
const {
  networkConfig,
  developmentChains,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
const {
  storeImages,
  storeTokenUriMetadata,
} = require("../utils/uploadToPinata");
const { parseEther } = require("ethers");

const FUND_AMOUNT = parseEther("100");
const imagesLocation = "./images/randomNft/";

const metadataTemplate = {
  name: "",
  description: "",
  image: "",
  attributes: [
    {
      trait_type: "",
      value: 100,
    },
  ],
};

let tokenUris = [
  "ipfs://QmZYmH5iDbD6v3U2ixoVAjioSzvWJszDzYdbeCLquGSpVm",
  "ipfs://QmYQC5aGZu2PTH8XzbJrbDnvhj3gVs7ya33H9mqUNvST3d",
  "ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo",
];

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let vrfCoordinatorV2_5Address, subscriptionId, vrfCoordinatorV2_5Mock;

  log("----------------------------------------------------");

  // 如果需要，上传图片到IPFS
  if (process.env.UPLOAD_TO_PINATA == "true") {
    tokenUris = await handleTokenUris();
  }

  // 本地环境上，使用mock合约
  if (chainId == 31337) {
    const vrfCoordinatorDeployment = await deployments.get(
      "VRFCoordinatorV2_5Mock"
    );
    const signer = await ethers.getSigner(deployer);
    vrfCoordinatorV2_5Mock = await ethers.getContractAt(
      "VRFCoordinatorV2_5Mock",
      vrfCoordinatorDeployment.address,
      signer
    );
    vrfCoordinatorV2_5Address = vrfCoordinatorV2_5Mock.target;

    const txResponse = await vrfCoordinatorV2_5Mock.createSubscription();
    const txReceipt = await txResponse.wait(1);
    const event = txReceipt.logs
      .map((log) => {
        try {
          return vrfCoordinatorV2_5Mock.interface.parseLog(log);
        } catch (e) {
          return null;
        }
      })
      .find((e) => e?.name === "SubscriptionCreated");
    subscriptionId = event.args.subId;
    log("subscriptionId", subscriptionId);
    await vrfCoordinatorV2_5Mock.fundSubscription(subscriptionId, FUND_AMOUNT);
  } else {
    vrfCoordinatorV2_5Address = networkConfig[chainId].vrfCoordinatorV2_5;
    subscriptionId = networkConfig[chainId].subscriptionId;
  }

  const mintFee = networkConfig[chainId].mintFee;
  const args = [vrfCoordinatorV2_5Address, subscriptionId, tokenUris, mintFee];

  log("----------------------------------------------------");
  log("Deploying RandomIpfsNft and waiting for confirmations...");

  const randomIpfsNft = await deploy("RandomIpfsNft", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: networkConfig[chainId].blockConfirmations || 1,
  });

  log(`RandomIpfsNft deployed at ${randomIpfsNft.address}`);

  if (chainId == 31337) {
    await vrfCoordinatorV2_5Mock.addConsumer(
      subscriptionId,
      randomIpfsNft.address
    );
    log("Adding consumer to VRF subscription...");

    // 验证消费者是否添加成功
    const subInfo = await vrfCoordinatorV2_5Mock.getSubscription(
      subscriptionId
    );
    console.log("Subscription consumers:", subInfo.consumers);
  }

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log("Verifying...");
    await verify(randomIpfsNft.address, args);
  }

  log("----------------------------------------------------");
};

async function handleTokenUris() {
  const tokenUriList = [];
  const { responses: imageUploadResponses, files } = await storeImages(
    imagesLocation
  );

  for (const imageUploadResponseIndex in imageUploadResponses) {
    const imageUploadResponse = imageUploadResponses[imageUploadResponseIndex];

    // 创建元数据
    const tokenUriMetadata = { ...metadataTemplate };

    tokenUriMetadata.name = files[imageUploadResponseIndex]?.replace(
      ".png",
      ""
    );
    tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name}`;
    tokenUriMetadata.image = `ipfs://${imageUploadResponse.IpfsHash}`;

    const metadataUploadResponse = await storeTokenUriMetadata(
      tokenUriMetadata
    );

    tokenUriList.push(`ipfs://${metadataUploadResponse}`);
  }

  console.log(`Token URIs uploaded! They are:`);
  console.log(tokenUriList);
  return tokenUriList;
}

module.exports.tags = ["all", "randomIpfsNft", "main"];
