const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Store a favoriteNumber and get it", function () {
  it("test store a favoriteNumber", async function () {
    const [owner] = await ethers.getSigners();
    console.log(`Owner address: ${owner.address}`);

    const contract = await ethers.deployContract("SimpleStorage");
    await contract.waitForDeployment();
    console.log(`Contract deployed at ${contract.target}`);

    const currentValue = await contract.retrieve();
    console.log(`Current value is ${currentValue}`);
    expect(currentValue).to.equal(0);

    // Update the current value
    const transactionResponse = await contract.store("11");
    await transactionResponse.wait(1);
    const updatedValue = await contract.retrieve();
    expect(updatedValue).to.equal("11");
    console.log(`Updated value is ${updatedValue}`);
  });
});
