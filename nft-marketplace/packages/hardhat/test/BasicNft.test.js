const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BasicNft Contract", function () {
  let BasicNft;
  let basicNft;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    // 获取合约工厂和账户
    [owner, addr1, addr2] = await ethers.getSigners();
    BasicNft = await ethers.getContractFactory("BasicNft");
    basicNft = await BasicNft.deploy();
  });

  describe("Deployment", function () {
    it("Should have correct name and symbol", async function () {
      expect(await basicNft.name()).to.equal("Dogie");
      expect(await basicNft.symbol()).to.equal("DOG");
    });

    it("Should initialize token counter to 0", async function () {
      expect(await basicNft.getTokenCounter()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should mint NFT to sender and increment counter", async function () {
      const initialCounter = await basicNft.getTokenCounter();

      // addr1 铸造 NFT
      await basicNft.connect(addr1).mintNft();
      const counterPlusOne = await basicNft.getTokenCounter()
      // 验证计数器增加
      expect(counterPlusOne).to.equal(initialCounter + 1n);
      // 验证所有权
      expect(await basicNft.ownerOf(0)).to.equal(addr1.address);
    });

    it("Should allow multiple mints and track ownership", async function () {
      // 铸造三个 NFT
      await basicNft.connect(addr1).mintNft(); // tokenId 0
      await basicNft.connect(addr2).mintNft(); // tokenId 1
      await basicNft.connect(addr1).mintNft(); // tokenId 2

      // 验证计数器
      expect(await basicNft.getTokenCounter()).to.equal(3);

      // 验证所有权
      expect(await basicNft.ownerOf(0)).to.equal(addr1.address);
      expect(await basicNft.ownerOf(1)).to.equal(addr2.address);
      expect(await basicNft.ownerOf(2)).to.equal(addr1.address);
    });
  });

  describe("Edge Cases", function () {
    it("Should track token counter correctly after multiple mints", async function () {
      const initialCounter = await basicNft.getTokenCounter();
      const mintCount = 5;
      for (let i = 0; i < mintCount; i++) {
        await basicNft.mintNft();
      }

      const counter = await basicNft.getTokenCounter()
      expect(counter).to.equal(initialCounter + BigInt(mintCount));
    });
  });
});
