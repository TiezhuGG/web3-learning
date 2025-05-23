const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFT Marketplace", function () {
  let nft;
  let marketplace;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    // 获取测试账户
    [owner, addr1, addr2] = await ethers.getSigners();

    // 部署合约
    const NFT = await ethers.getContractFactory("NFT");
    nft = await NFT.deploy();
    await nft.waitForDeployment();

    const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
    marketplace = await NFTMarketplace.deploy();
    await marketplace.waitForDeployment();
  });

  describe("NFT Contract", function () {
    it("Should mint a new token", async function () {
      const tokenURI = "https://example.com/token/1";
      const mintPrice = ethers.parseEther("0.01");

      await nft.connect(addr1).mint(tokenURI, { value: mintPrice });
      expect(await nft.ownerOf(1)).to.equal(addr1.address);
      expect(await nft.tokenURI(1)).to.equal(tokenURI);
    });
  });

  describe("Marketplace", function () {
    const price = ethers.parseEther("1");
    const tokenURI = "https://example.com/token/1";

    beforeEach(async function () {
      // 铸造NFT
      await nft
        .connect(addr1)
        .mint(tokenURI, { value: ethers.parseEther("0.01") });
      // 授权marketplace
      await nft.connect(addr1).approve(await marketplace.getAddress(), 1);
    });

    it("Should create a listing", async function () {
      await marketplace
        .connect(addr1)
        .createListing(await nft.getAddress(), 1, price);

      const listing = await marketplace.listings(await nft.getAddress(), 1);
      expect(listing.seller).to.equal(addr1.address);
      expect(listing.price).to.equal(price);
      expect(listing.isActive).to.be.true;
    });

    it("Should buy an NFT", async function () {
      // 创建listing
      await marketplace
        .connect(addr1)
        .createListing(await nft.getAddress(), 1, price);

      // addr2购买NFT
      await marketplace
        .connect(addr2)
        .buyNFT(await nft.getAddress(), 1, { value: price });

      // 验证所有权转移
      expect(await nft.ownerOf(1)).to.equal(addr2.address);

      // 验证listing已关闭
      const listing = await marketplace.listings(await nft.getAddress(), 1);
      expect(listing.isActive).to.be.false;
    });

    it("Should create and finalize an auction", async function () {
      const startingPrice = ethers.parseEther("0.5");
      const bidAmount = ethers.parseEther("1");
      const duration = 3600; // 1小时

      // 创建拍卖
      await marketplace
        .connect(addr1)
        .createAuction(await nft.getAddress(), 1, startingPrice, duration);

      // addr2出价
      await marketplace
        .connect(addr2)
        .placeBid(await nft.getAddress(), 1, { value: bidAmount });

      // 快进时间
      await ethers.provider.send("evm_increaseTime", [duration + 1]);
      await ethers.provider.send("evm_mine", []);

      // 完成拍卖
      await marketplace.finalizeAuction(await nft.getAddress(), 1);

      // 验证所有权转移
      expect(await nft.ownerOf(1)).to.equal(addr2.address);
    });
  });
});
