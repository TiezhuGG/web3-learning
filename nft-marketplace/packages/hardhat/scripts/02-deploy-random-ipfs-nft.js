import { ethers, network } from "hardhat";
import { networkConfig, developmentChains } from "../helper-config";
import { verify } from "../utils/verify";
import { storeImages, storeTokenUriMetadata } from "../utils/uploadToPinata";

const imagesLocation = "./images/randomNft/";

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  let tokenUris = [
    "ipfs://QmZYmH5iDbD6v3U2ixoVAjioSzvWJszDzYdbeCLquGSpVm",
    "ipfs://QmYQC5aGZu2PTH8XzbJrbDnvhj3gVs7ya33H9mqUNvST3d",
    "ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo",
  ];

  let linkTokenAddress = networkConfig[chainId].linkToken;
  let vrfWrapperAddress = networkConfig[chainId].vrfWrapper;

  log("Deploying RandomIpfsNft and waiting for confirmations...");

  await storeImages(imagesLocation)

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

  await randomIpfsNft.waitForDeployment();
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
  const tokenUris = [];
//   const { responses: imageUploadResponses, files } = await storeImages(
//     imagesLocation
//   );

//   for (const imageUploadResponseIndex in imageUploadResponses) {
//     const imageUploadResponse = imageUploadResponses[imageUploadResponseIndex];

//     // 创建元数据
//     const tokenUriMetadata = {
//       name: files[imageUploadResponseIndex]?.replace(".png", ""),
//       description: `An adorable ${files[imageUploadResponseIndex]?.replace(
//         ".png",
//         ""
//       )}!`,
//       image: `ipfs://${imageUploadResponse}`,
//       attributes: [
//         {
//           trait_type: "Cuteness",
//           value: Math.floor(Math.random() * 100),
//         },
//       ],
//     };

//     const metadataUploadResponse = await storeTokenUriMetadata(
//       tokenUriMetadata
//     );
//     tokenUris.push(`ipfs://${metadataUploadResponse}`);
//   }

  console.log(`Token URIs uploaded! They are: ${tokenUris}`);
  return tokenUris;
}

module.exports.tags = ["all", "randomIpfsNft", "main"]; 