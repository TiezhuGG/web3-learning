## 开始

```bash
git clone...
cd...
pnpm install
pnpm dev
```

### 设置环境变量

```
NEXT_PUBLIC_SEPOLIA_RPC_URL=<your_sepolia_rpc_url>
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your_walletconnect_project_id>
NEXT_PUBLIC_PINATA_API_KEY=<your_pinata_api_key>
NEXT_PUBLIC_PINATA_API_SECRET=<your_pinata_api_secret>
NEXT_PUBLIC_HARDHAT_RPC_URL="http://127.0.0.1:8545"
NEXT_PUBLIC_GATEWAY_PINATA_CLOUD_IPFS=https://gateway.pinata.cloud/ipfs/
```

### 模拟使用 Chainlnk VRF V2.5 请求随机数

#### 需要主动获取并传递 requestId 到 Mock 合约的 fulfillRandomWords 函数中

```js
const requestNftAddress = "requestNft函数所在合约地址"
const requestNftAbi = "requestNft函数所在合约地址abi"
const address = "调用requestNft函数的地址"
const mintFee = "铸造费用"
const publicClient = usePublicClient();
const { writeContractAsync } = useContractWrite();

interface NFTRequestedEvent {
  eventName: "NFTRequested";
  args: {
    requestId: bigint;
    requester: string;
  };
}

// 若requestNft函数明确返回了requestId，可以使用useSimulateContract模拟获取
const getRequestIdBySimulate = async () => {
  const requestNftData = await publicClient?.simulateContract({
      address: requestNftAddress,
      abi: requestNftAbi,
      functionName: "requestNft",
      account: address,
      value: mintFee,
  });

  // 需要调用requestNft检查是否需要授权
  await writeContractAsync(requestNftData?.request!);
  return requestNftData?.result;
}
```

#### 如果 requestNft 函数没有返回 requestId 则需解码事件日志

```js
const getRequestIdByDecodeLog = async () => {
  const hash = await writeContractAsync({
    address: RANDOMIPFSNFT_CONTRACT_ADDRESS,
    abi: RANDOMIPFSNFT_ABI,
    functionName: "requestNft",
    value: mintFee,
  });

  const receipt = await publicClient?.waitForTransactionReceipt({
    hash,
  });

  const requestNftLog = receipt?.logs.find((log) => {
    try {
      const result = decodeEventLog({
        abi: RANDOMIPFSNFT_ABI,
        data: log.data,
        topics: log.topics,
      });
      return result.eventName === "NFTRequested";
    } catch (error) {
      return false;
    }
  });

  if (!requestNftLog) {
    throw new Error("No requestNftLog found");
  }

  const decodedLog = decodeEventLog({
    abi: RANDOMIPFSNFT_ABI,
    data: requestNftLog.data,
    topics: requestNftLog.topics,
  }) as unknown as NFTRequestedEvent;

  const { requestId } = decodedLog.args;

  return requestId;
};
```

#### 最后需要调用 Mock 合约中的 fulfillRandomWords 函数

```js
const requestFulfillRandomWords = async (requestId: bigint) => {
  const hash = await writeContractAsync({
    address: MOCK_VRF_CONTRACT_ADDRESS,
    abi: MOCK_VRF_ABI,
    functionName: "fulfillRandomWords",
    args: [requestId, RANDOMIPFSNFT_CONTRACT_ADDRESS],
  });

  const receipt = await publicClient?.waitForTransactionReceipt({
    hash,
  });

  console.log("fulfillRandomWords success", receipt);
  if (receipt?.status === "success") {
    return true;
  }
};
```

#### 本地链：chainId 为 31337 时，调用模拟函数获取 requestId 并调用 fulfillRandomWords 函数

```js
if (chainId == 31337) {
    const requestId = await getRequestIdBySimulate();
    const result = await requestFulfillRandomWords(requestId!);
    ...
}
```

#### 监听 NFTMinted 事件

```js
useEffect(() => {
  let unwatch: WatchContractEventReturnType | undefined;

  const setEventWatcher = async () => {
    // 获取当前区块号
    const latestBlockNumber = await publicClient?.getBlockNumber();
    if (!latestBlockNumber) return;

    // 监听NFT铸造成功的NFTMinted事件
    unwatch = publicClient?.watchContractEvent({
      address: RANDOMIPFSNFT_CONTRACT_ADDRESS,
      abi: RANDOMIPFSNFT_ABI,
      eventName: "NFTMinted",
      fromBlock: latestBlockNumber + 1n, // 从最新区块号开始监听，避免重复监听历史事件
      onLogs: async (logs) => {
        console.log("NFTMinted event args:", logs);
        const { data: newTokenCounter } = await refetchTokenCounter();
        setLastMintedTokenId(
          typeof newTokenCounter === "bigint"
            ? newTokenCounter - 1n
            : undefined
        );
        toast.success("Mint NFT successfully.");
      },
    });
  };

  setEventWatcher();

  return () => unwatch!();
}, [publicClient, setLastMintedTokenId]);
```

### 自定义生成 NFT

##### 上传元数据到 pinata 返回 tokenURI

```js
const baseUrl = "https://api.pinata.cloud";
const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const apiSecret = process.env.NEXT_PUBLIC_PINATA_API_SECRET;

const uploadFile = async (
  file: File,
  options?: { name?: string, keyvalues?: Record<string, string> }
): Promise<PinataResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${baseUrl}/pinning/pinFileToIPFS`, {
    method: "POST",
    headers: {
      pinata_api_key: apiKey,
      pinata_secret_api_key: apiSecret,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload file to Pinata: ${error}`);
  }

  return response.json();
};

const uploadJSON = async (
  metadata: NFTMetadata,
  options?: { name?: string }
): Promise<PinataResponse> => {
  const response = await fetch(`${baseUrl}/pinning/pinJSONToIPFS`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      pinata_api_key: apiKey,
      pinata_secret_api_key: apiSecret,
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataOptions: { cidVersion: 1 },
      pinataMetadata: {
        name: options?.name || `NFT-Metadata-${Date.now()}`,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload JSON to Pinata: ${error}`);
  }

  return response.json();
};

const uploadImage = async (file: File, name?: string): Promise<string> => {
  const response = await pinata.uploadFile(file, {
    name: name || `NFT-Image-${Date.now()}`,
    keyvalues: {
      type: "nft-image",
      uploadedAt: new Date().toISOString(),
    },
  });
  
  return response.IpfsHash;
};

const uploadMetadata = async (
  metadata: NFTMetadata,
  name?: string
): Promise<string> => {
  const response = await pinata.uploadJSON(metadata, {
    name: name || `NFT-Metadata-${Date.now()}`,
  });

  return response.IpfsHash;
};

const uploadNFT = async (
  imageFile: File,
  metadata: Omit<NFTMetadata, "image">,
  name?: string
): Promise<{
  imageHash: string,
  metadataHash: string,
  tokenURI: string,
}> => {
  const imageHash = await uploadImage(imageFile, `${name}-image`);
  const imageUrl = `ipfs://${imageHash}`;

  const completeMetadata: NFTMetadata = {
    ...metadata,
    image: imageUrl,
  };

  const metadataHash = await uploadMetadata(completeMetadata, `${name}`);
  const tokenURI = `ipfs://${metadataHash}`;

  return {
    imageHash,
    metadataHash,
    tokenURI,
  };
};
```
