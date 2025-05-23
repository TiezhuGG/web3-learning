# NFT-Marketplace

### 下载项目:

```shell
git clone ...
cd ...
pnpm install
```

### 进行测试：

```shell
pnpm hardhat test
REPORT_GAS=true pnpm hardhat test
pnpm hardhat node
```

### 使用hardhat-deploy插件方式进行部署：

需要在hardhat.config.js导入用到的插件

先安装依赖：

```shell
pnpm add -D hardhat-deploy hardhat-deploy-ethers @nomicfoundation/hardhat-ethers
```

部署所有合约
```shell
pnpm hardhat deploy
```

单独部署randomIpfsNft
```shell
pnpm hardhat deploy --tags randomIpfsNft
```

#### 使用 chainlink VRF V2.5 请求随机数

```solidity
// sepolia 测试网地址
// Address LINK
// address public linkAddress = 0x779877A7B0D9E8603169DdbD7836e478b4624789;

// address WRAPPER
// address public wrapperAddress = 0x195f15F2d49d693cE265b4fB0fdDbE15b1850Cc1;
contract RandomIpfsNft is VRFV2WrapperConsumerBase {
    constructor(
        address linkAddress, // VRF合约地址
        address wrapperAddress, // VRF包装器地址
    )
        VRFV2WrapperConsumerBase(linkAddress,wrapperAddress)
    {}

    function requestNft() public payable returns (uint256 requestId) {
        // 调用VRF函数requestRandomness请求随机数
        requestId = requestRandomness(
            CALLBACK_GAS_LIMIT,
            REQUEST_CONFIRMATIONS,
            NUM_WORDS
        );

        return requestId;
    }

    // 在VRF请求完成后，VRF合约会调用这个函数
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        // 你可以拿到requestId和randomWords
        // 这里可以使用requestId获取代币所有者，使用randomWords去铸造代币
    }
}

```

#### 上传图片和元数据到pinata

```shell
pnpm add @pinata/sdk
```

创建pinata实例，实现storeImages和storeTokenUriMetadata上传数据到pinata

```js
const pinataApiKey = process.env.PINATA_API_KEY;
const pinataApiSecret = process.env.PINATA_API_SECRET;
const pinata = new pinataSDK(pinataApiKey, pinataApiSecret);

async function storeImages(imagesFilePath) {
  const fullImagesPath = path.resolve(imagesFilePath);
  const files = fs.readdirSync(fullImagesPath);
  let responses = [];

  for (const fileIndex in files) {
    console.log(`Uploading Image to IPFS: ${files[fileIndex]}...`);
    const readableStreamForFile = fs.createReadStream(
      `${fullImagesPath}/${files[fileIndex]}`
    );
    try {
      const options = {
        pinataMetadata: {
          name: files[fileIndex],
        },
      };
      const response = await pinata.pinFileToIPFS(
        readableStreamForFile,
        options
      );

      responses.push(response);
    } catch (error) {
      console.log(error);
    }
  }

  return { responses, files };
}

async function storeTokenUriMetadata(metadata) {
  try {
    const options = {
      pinataMetadata: {
        name: metadata.name,
      },
    };
    const response = await pinata.pinJSONToIPFS(metadata, options);
    return response;
  } catch (error) {
    console.log(error);
  }
  return null;
}

// 元数据模板
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

// 部署时调用
async function handleTokenUris() {
  const tokenUriList = [];
  const { responses: imageUploadResponses, files } = await storeImages(
    imagesLocation
  );

  for (const imageUploadResponseIndex in imageUploadResponses) {
    const imageUploadResponse = imageUploadResponses[imageUploadResponseIndex];
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
```
