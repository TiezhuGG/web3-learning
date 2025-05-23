const { ethers, network } = require("hardhat");
const {
  networkConfig,
  developmentChains,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
const {
  storeImages,
  storeTokenUriMetadata,
} = require("../utils/uploadToPinata");

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

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  let tokenUris = [
    "ipfs://QmZYmH5iDbD6v3U2ixoVAjioSzvWJszDzYdbeCLquGSpVm",
    "ipfs://QmYQC5aGZu2PTH8XzbJrbDnvhj3gVs7ya33H9mqUNvST3d",
    "ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo",
  ];

  let linkTokenAddress = networkConfig[chainId]?.linkToken;
  let vrfWrapperAddress = networkConfig[chainId]?.vrfWrapper;

  log("Deploying RandomIpfsNft and waiting for confirmations...");

  // 如果需要，上传图片到IPFS
  if (process.env.UPLOAD_TO_PINATA == "true") {
    tokenUris = await handleTokenUris();
  }

  const mintFee = networkConfig[chainId].mintFee || ethers.parseEther("0.001");
  const args = [linkTokenAddress, vrfWrapperAddress, tokenUris, mintFee];

  const randomIpfsNft = await deploy("RandomIpfsNft", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: networkConfig[chainId].blockConfirmations || 1,
  });

  log(`RandomIpfsNft deployed at ${randomIpfsNft.address}`);

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
