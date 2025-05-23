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

### 进行部署：

先安装依赖：

```shell
pnpm add -D hardhat-deploy hardhat-deploy-ethers @nomicfoundation/hardhat-ethers
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
