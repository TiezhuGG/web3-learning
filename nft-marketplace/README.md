## 开始

首先安装依赖：

```bash
cd ntf-marketplace
pnpm install
```

启动 hardhat 本地环境：

```bash
cd packages/hardhat
pnpm hardhat node
pnpm hardhat deploy --network localhost
```

启动 nextjs：

```bash
cd packages/nextjs
pnpm dev
```

在浏览器打开 http://localhost:3000

## 项目整体流程

#### 1. 智能合约

- Hardhat 项目设置
- Chainlink VRF Mocks 部署 (包括订阅创建、充值、消费者添加)
- RandomIpfsNft.sol 部署
- NftMarketplace.sol 部署

#### 2.IPFS 集成 (Pinata)

- 后端辅助脚本验证与优化
- 前端 IPFS 上传流程整合

#### 3.前端 UI/UX (React/Next.js + Wagmi/Viem)

- ##### 连接钱包
- ##### 铸造 NFT

  - 显示铸造费用
  - 发起 VRF 请求 (调用 RandomIpfsNft.requestNft)
  - 监听 NFTRequested 事件，获取 requestId
  - （在本地开发环境中）手动调用 VRFCoordinatorV2_5Mock.fulfillRandomWords
  - 监听 NFTMinted 事件，获取 tokenId 和 rarity
  - 获取 NFT URI 并展示 NFT 信息

- ##### 展示铸造的 NFT

  - 获取用户拥有的 NFT 列表
  - 解析 NFT URI 获取元数据和图片
  - 展示 NFT 图片和属性

- ##### 上架 NFT 出售 (List Item)

  - 检查 NFT 是否已批准 Marketplace.sol 合约 (调用 ERC721 的 getApproved 函数)
  - 如果未批准，请求批准 (调用 ERC721 的 approve 函数)
  - 调用 NftMarketplace.listItem
  - 监听 ItemListed 事件

- ##### 取消 NFT 列表 (Cancel Listing)

  - 调用 NftMarketplace.cancelListing
  - 监听 ItemCanceled 事件

- ##### 更新 NFT 列表价格 (Update Listing)
  - 调用 NftMarketplace.updateListing
  - 监听 ItemListed 事件 (更新也是触发这个事件)

- ##### 购买 NFT (Buy Item)
    - 显示 NFT 价格 (ETH)
    - 调用 NftMarketplace.buyItem
    - 监听 ItemBought 事件

- ##### 提取收益 (Withdraw Proceeds)
  - 显示可提取收益
  - 调用 NftMarketplace.withdrawProceeds
