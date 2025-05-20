const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Raffle", function () {
  let raffle;
  let owner;
  let player1;
  let player2;
  const entranceFee = ethers.parseEther("0.01");

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();
    console.log(
      "players: ",
      player1.address,
      player2.address,
      "owner: ",
      owner.address,
      "entranceFee: ",
      entranceFee,
      "network: ",
      network.config.chainId,
      "chainId: ",
      network.config.chainId === 11155111 ? "sepolia" : "hardhat"
    );

    const Raffle = await ethers.getContractFactory("Raffle");
    raffle = await Raffle.deploy(entranceFee);
    await raffle.waitForDeployment(); // 等待部署完成
  });

  describe("enterRaffle", function () {
    it("reverts when you don't pay enough, entranceFee is 0.01 ether", async function () {
      await expect(
        raffle.connect(player1).enterRaffle({
          value: ethers.parseEther("0.001"),
        })
      ).to.be.revertedWithCustomError(raffle, "Raffle_NotEnoughETHEntered");
    });

    it("records players when they enter", async function () {
      await raffle.connect(player1).enterRaffle({
        value: entranceFee,
      });
      const player = await raffle.getPlayer(0);
      const playerCount = await raffle.getNumberOfPlayers();
      expect(player).to.equal(player1.address);
      expect(playerCount).to.equal(1);
    });

    it("emits event on enter", async function () {
      await expect(raffle.connect(player1).enterRaffle({ value: entranceFee }))
        .to.emit(raffle, "RaffleEnter")
        .withArgs(player1.address);
    });
  });

  describe("pickRandomWinner", function () {
    it("Should reject pick winner when no players entered", async function () {
      await expect(raffle.pickRandomWinner()).to.be.revertedWith(
        "No players entered!"
      );
    });

    it("Should pick winner and pay for", async function () {
      await raffle.connect(player1).enterRaffle({
        value: entranceFee,
      });
      await raffle.connect(player2).enterRaffle({
        value: entranceFee,
      });

      // get the initial balance of the contract
      const initialBalanceOfContract = await ethers.provider.getBalance(
        raffle.target
      );
      expect(initialBalanceOfContract).to.equal(entranceFee * 2n); // 2 players entered, each paid 0.01 ether

      // get the initial balance of the player1 and player2
      const initialBalanceOfPlayer1 = await ethers.provider.getBalance(
        player1.address
      );
      const initialBalanceOfPlayer2 = await ethers.provider.getBalance(
        player2.address
      );

      // pick the winner
      const tx = await raffle.pickRandomWinner();
      const receipt = await tx.wait();
      const recentWinner = await raffle.getRecentWinner();

      await expect(tx).to.emit(raffle, "WinnerPicked").withArgs(recentWinner);

      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const finalBalanceOfContract = await ethers.provider.getBalance(
        raffle.target
      );
      expect(finalBalanceOfContract).to.equal(0); // the contract should be empty after picking the winner

      // get the final balance of the player1 and player2
      const finalBalanceOfPlayer1 = await ethers.provider.getBalance(
        player1.address
      );
      const finalBalanceOfPlayer2 = await ethers.provider.getBalance(
        player2.address
      );

      // check if the winner got the money
      if (recentWinner === player1.address) {
        expect(finalBalanceOfPlayer1).to.be.gt(
          initialBalanceOfPlayer1 - gasUsed
        );
      }

      if (recentWinner === player2.address) {
        expect(finalBalanceOfPlayer2).to.be.gt(
          initialBalanceOfPlayer2 - gasUsed
        );
      }

      const playerCount = await raffle.getNumberOfPlayers();
      expect(playerCount).to.equal(0);
    });
  });

  describe("getEntranceFee", function () {
    it("Should return correct entrance fee", async function () {
      const fee = await raffle.getEntranceFee();
      expect(fee).to.equal(entranceFee);
    });
  });
});
