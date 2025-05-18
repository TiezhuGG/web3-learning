const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

describe("Store a favoriteNumber and get it", function () {
  let SimpleStorageFactory, simpleStorage;
  beforeEach(async function () {
    SimpleStorageFactory = await ethers.getContractFactory("SimpleStorage");
    simpleStorage = await SimpleStorageFactory.deploy();
  });

  it("Should start with a favorite number of 0", async function () {
    const currentValue = await simpleStorage.retrieve();
    const expectedValue = "0";
    assert.equal(currentValue, expectedValue);
  });

  it("Should update when we call store", async function () {
    // Update the current value
    const expectedValue = "11";
    const transactionResponse = await simpleStorage.store(expectedValue);
    await transactionResponse.wait(1);

    const updatedValue = await simpleStorage.retrieve();
    expect(updatedValue).to.equal(expectedValue); // like assert.equal, choose any one
    console.log(`Updated value is ${updatedValue}`);
  });

  it("test addPerson function", async function() {
    const expectedName = "FFF";
    const expectedFavoriteNumber = "9";
    const transactionResponse = await simpleStorage.addPerson(expectedName, expectedFavoriteNumber);
    await transactionResponse.wait(1);

    const person = await simpleStorage.people(0);
    expect(person.name).to.equal(expectedName);
    expect(person.favoriteNumber).to.equal(expectedFavoriteNumber);
  })
});
