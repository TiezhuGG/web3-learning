## 开始

```bash
git clone...
cd...
pnpm install
pnpm dev
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

#### 如果没有返回 requestId 则需解码事件日志

```js
const getRequestIdByDecodeLog = async () => {
const hash = await writeContractAsync({
    address: requestNftAddress,
    abi: requestNftAbi,
    functionName: "requestNft",
    value: mintFee,
});

const receipt = await publicClient?.waitForTransactionReceipt({
    hash,
});

const requestNftLog = receipt?.logs.find((log) => {
    try {
    const result = decodeEventLog({
        abi: requestNftAbi,
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
    abi: requestNftAbi,
    data: requestNftLog.data,
    topics: requestNftLog.topics,
}) as unknown as NFTRequestedEvent;

const { requestId } = decodedLog.args;

return requestId;
}
```

#### 最后需要调用 Mock 合约中的 fulfillRandomWords 函数

```js
const requestFulfillRandomWords = async (requestId: bigint) => {
  const hash = await writeContractAsync({
    address: MOCK_VRF_CONTRACT_ADDRESS,
    abi: MOCK_VRF_ABI,
    functionName: "fulfillRandomWords",
    args: [requestId, RANDOM_IPFS_NFT_CONTRACT_ADDRESS],
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

#### 本地链：chainId为31337时，调用模拟函数获取requestId并调用 fulfillRandomWords 函数

```js
if (chainId == 31337) {
    const requestId = await getRequestIdBySimulate();
    const result = await requestFulfillRandomWords(requestId!);
    ...
}
```
