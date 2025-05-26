const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Nft Marketplace Unit Tests", function () {
      let nftMarketplace,
        nftMarketplaceContract,
        basicNft,
        basicNftContract,
        marketplaceAddress,
        basicNftAddress,
        user;
      const PRICE = ethers.parseEther("0.1");
      const TOKEN_ID = 0;

      beforeEach(async () => {
        accounts = await ethers.getSigners(); // could also do with getNamedAccounts
        deployer = accounts[0];
        user = accounts[1];
        await deployments.fixture(["all"]);
        const NftMarketplaceContract = await ethers.getContractFactory(
          "NftMarketplace"
        );
        nftMarketplaceContract = await NftMarketplaceContract.deploy();
        marketplaceAddress = await nftMarketplaceContract.getAddress();
        await nftMarketplaceContract.waitForDeployment();
        nftMarketplace = nftMarketplaceContract.connect(deployer);

        const BasicNftContract = await ethers.getContractFactory("BasicNft");
        basicNftContract = await BasicNftContract.deploy();
        basicNftAddress = await basicNftContract.getAddress();
        await basicNftContract.waitForDeployment();
        basicNft = basicNftContract.connect(deployer);

        await basicNft.mintNft();
        await basicNft.approve(marketplaceAddress, TOKEN_ID);
      });

      describe("listItem", function () {
        it("emits an event after listing an item", async function () {
          expect(
            await nftMarketplace.listItem(basicNftAddress, TOKEN_ID, PRICE)
          ).to.emit("ItemListed");
        });

        it("exclusively items that haven't been listed", async function () {
          await nftMarketplace.listItem(basicNftAddress, TOKEN_ID, PRICE);
          await expect(
            nftMarketplace.listItem(basicNftAddress, TOKEN_ID, PRICE)
          )
            .to.be.revertedWithCustomError(nftMarketplace, "AlreadyListed")
            .withArgs(basicNftAddress, TOKEN_ID);
        });

        it("exclusively allows owners to list", async function () {
          nftMarketplace = nftMarketplaceContract.connect(user);
          await basicNft.approve(user.address, TOKEN_ID);
          await expect(
            nftMarketplace.listItem(basicNftAddress, TOKEN_ID, PRICE)
          ).to.be.revertedWithCustomError(nftMarketplace, "NotOwner");
        });

        it("Updates listing with seller and price", async function () {
          await nftMarketplace.listItem(basicNftAddress, TOKEN_ID, PRICE);
          const listing = await nftMarketplace.getListing(
            basicNftAddress,
            TOKEN_ID
          );
          assert(listing.price.toString() == PRICE.toString());
          assert(listing.seller.toString() == deployer.address);
        });

        it("reverts if the price be 0", async () => {
          const ZERO_PRICE = ethers.parseEther("0");
          await expect(
            nftMarketplace.listItem(basicNftAddress, TOKEN_ID, ZERO_PRICE)
          ).revertedWithCustomError(nftMarketplace, "PriceMustBeAboveZero");
        });
      });

      describe("cancelListing", function () {
        it("reverts if there is no listing", async function () {
          await expect(nftMarketplace.cancelListing(basicNftAddress, TOKEN_ID))
            .to.be.revertedWithCustomError(nftMarketplace, "NotListed")
            .withArgs(basicNftAddress, TOKEN_ID);
        });

        it("reverts if anyone but the owner tries to call", async function () {
          await nftMarketplace.listItem(basicNftAddress, TOKEN_ID, PRICE);
          nftMarketplace = nftMarketplaceContract.connect(user);
          await basicNft.approve(user.address, TOKEN_ID);
          await expect(
            nftMarketplace.cancelListing(basicNftAddress, TOKEN_ID)
          ).to.be.revertedWithCustomError(nftMarketplace, "NotOwner");
        });

        it("emits event and removes listing", async function () {
          await nftMarketplace.listItem(basicNftAddress, TOKEN_ID, PRICE);
          expect(
            await nftMarketplace.cancelListing(basicNftAddress, TOKEN_ID)
          ).to.emit("ItemCanceled");
          const listing = await nftMarketplace.getListing(
            basicNftAddress,
            TOKEN_ID
          );
          assert(listing.price.toString() == "0");
        });
      });

      describe("buyItem", function () {
        it("reverts if the item isnt listed", async function () {
          await expect(
            nftMarketplace.buyItem(basicNftAddress, TOKEN_ID)
          ).to.be.revertedWithCustomError(nftMarketplace, "NotListed");
        });

        it("reverts if the price isnt met", async function () {
          await nftMarketplace.listItem(basicNftAddress, TOKEN_ID, PRICE);
          await expect(
            nftMarketplace.buyItem(basicNftAddress, TOKEN_ID)
          ).to.be.revertedWithCustomError(nftMarketplace, "PriceNotMet");
        });

        it("transfers the nft to the buyer and updates internal proceeds record", async function () {
          await nftMarketplace.listItem(basicNftAddress, TOKEN_ID, PRICE);
          nftMarketplace = nftMarketplaceContract.connect(user);
          expect(
            await nftMarketplace.buyItem(basicNftAddress, TOKEN_ID, {
              value: PRICE,
            })
          ).to.emit("ItemBought");
          const newOwner = await basicNft.ownerOf(TOKEN_ID);
          const deployerProceeds = await nftMarketplace.getProceeds(
            deployer.address
          );
          assert(newOwner.toString() == user.address);
          assert(deployerProceeds.toString() == PRICE.toString());
        });
      });

      describe("updateListing", function () {
        it("must be owner and listed", async function () {
          await expect(
            nftMarketplace.updateListing(basicNftAddress, TOKEN_ID, PRICE)
          ).to.be.revertedWithCustomError(nftMarketplace, "NotListed");

          await nftMarketplace.listItem(basicNftAddress, TOKEN_ID, PRICE);
          nftMarketplace = nftMarketplaceContract.connect(user);

          await expect(
            nftMarketplace.updateListing(basicNftAddress, TOKEN_ID, PRICE)
          ).to.be.revertedWithCustomError(nftMarketplace, "NotOwner");
        });

        it("reverts if new price is 0", async function () {
          const updatedPrice = ethers.parseEther("0");
          await nftMarketplace.listItem(basicNftAddress, TOKEN_ID, PRICE);
          await expect(
            nftMarketplace.updateListing(
              basicNftAddress,
              TOKEN_ID,
              updatedPrice
            )
          ).to.be.revertedWithCustomError(
            nftMarketplace,
            "PriceMustBeAboveZero"
          );
        });

        it("updates the price of the item", async function () {
          const updatedPrice = ethers.parseEther("0.2");
          await nftMarketplace.listItem(basicNftAddress, TOKEN_ID, PRICE);
          expect(
            await nftMarketplace.updateListing(
              basicNftAddress,
              TOKEN_ID,
              updatedPrice
            )
          ).to.emit("ItemListed");
          const listing = await nftMarketplace.getListing(
            basicNftAddress,
            TOKEN_ID
          );
          assert(listing.price.toString() == updatedPrice.toString());
        });
      });

      describe("withdrawProceeds", function () {
        it("doesn't allow 0 proceed withdraw", async function () {
          await expect(
            nftMarketplace.withdrawProceeds()
          ).to.be.revertedWithCustomError(nftMarketplace, "NoProceeds");
        });

        it("withdraws proceeds", async function () {
          await nftMarketplace.listItem(basicNftAddress, TOKEN_ID, PRICE);
          nftMarketplace = nftMarketplaceContract.connect(user);
          await nftMarketplace.buyItem(basicNftAddress, TOKEN_ID, {
            value: PRICE,
          });
          nftMarketplace = nftMarketplaceContract.connect(deployer);

          const deployerProceedsBefore = await nftMarketplace.getProceeds(
            deployer.address
          );
          const deployerBalanceBefore = await ethers.provider.getBalance(
            deployer.address
          );

          const txResponse = await nftMarketplace.withdrawProceeds();
          const { gasUsed, gasPrice } = await txResponse.wait();
          const gasCost = gasUsed * gasPrice;

          const deployerBalanceAfter = await ethers.provider.getBalance(
            deployer.address
          );

          console.log({
            proceeds: deployerProceedsBefore,
            balanceBefore: deployerBalanceBefore,
            gasUsed: gasUsed,
            gasPrice: gasPrice,
            gasCost: gasCost,
            balanceAfter: deployerBalanceAfter,
          });

          assert(
            deployerBalanceAfter + gasCost ===
              deployerProceedsBefore + deployerBalanceBefore,

            `数值不匹配: ${deployerBalanceAfter + gasCost} ≠ ${
              deployerProceedsBefore + deployerBalanceBefore
            }`
          );
        });
      });
    });
