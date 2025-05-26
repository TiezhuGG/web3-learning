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

### 使用 hardhat-deploy 插件方式进行部署：

需要在 hardhat.config.js 导入用到的插件

先安装依赖：

```shell
pnpm add -D hardhat-deploy hardhat-deploy-ethers @nomicfoundation/hardhat-ethers
```

部署所有合约

```shell
pnpm hardhat deploy
```

单独部署 randomIpfsNft

```shell
pnpm hardhat deploy --tags randomIpfsNft
```

#### 使用 chainlink VRF V2.5 请求随机数

```solidity
// RandomIpfsNft.sol
import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

contract RandomIpfsNft is VRFConsumerBaseV2Plus {
    constructor(
        address vrfCoordinatorV2_5, // VRF Coordinator地址
        uint256 subscriptionId, // 订阅ID
    )
        VRFConsumerBaseV2Plus(vrfCoordinatorV2_5)
    {}

    function requestNft() public payable returns (uint256 requestId) {
      requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: KEY_HASH,
                subId: s_subscriptionId,
                requestConfirmations: REQUEST_CONFIRMATIONS,
                callbackGasLimit: CALLBACK_GAS_LIMIT,
                numWords: NUM_WORDS,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({
                        nativePayment: false  // 是否使用原生支付(ETH) 非原生支付是LINK
                    })
                )
            })
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

部署时使用 chainlink VRF V2.5 Mock本地测试请求随机数：

```js
const FUND_AMOUNT = "1000"; // 1000 LINK (本地测试记得输入大一点防止gas不够revert)

// 本地链（chainId === 31337）上，使用mock合约
if (chainId == 31337) {
  const vrfCoordinatorDeployment = await deployments.get(
    "VRFCoordinatorV2_5Mock"
  );
  const signer = await ethers.getSigner(deployer);
  // 获取mock合约实例
  vrfCoordinatorV2_5Mock = await ethers.getContractAt(
    "VRFCoordinatorV2_5Mock",
    vrfCoordinatorDeployment.address,
    signer
  );
  // mock合约地址
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
  // 获取订阅ID
  subscriptionId = event.args.subId;
  await vrfCoordinatorV2_5Mock.fundSubscription(subscriptionId, FUND_AMOUNT);
}

// 最后记得添加消费者(此处是 randomIpfsNft 合约)
if (chainId == 31337) {
  await vrfCoordinatorV2_5Mock.addConsumer(
    subscriptionId,
    randomIpfsNft.address
  );
  log("Adding consumer to VRF subscription...");

  // 验证消费者是否添加成功
  const subInfo = await vrfCoordinatorV2_5Mock.getSubscription(subscriptionId);
  console.log("Subscription consumers:", subInfo.consumers);
}
```

#### 上传图片和元数据到 pinata

```shell
pnpm add @pinata/sdk
```

创建 pinata 实例，实现 storeImages 和 storeTokenUriMetadata 上传数据到 pinata

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
