const { deployments } = require("hardhat");

describe("BasicNft", () => {
  beforeEach(async () => {
    await deployments.fixture(["basicNft"]);
  });

  it("Should mint NFT", async () => {
    const basicNft = await ethers.getContract("BasicNft", deployer);
    await basicNft.mintNft();
  });
});
