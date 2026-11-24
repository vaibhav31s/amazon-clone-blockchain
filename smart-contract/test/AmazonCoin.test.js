import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.getOrCreate();

describe("AmazonCoin", function () {
  it("mints tokens when the correct amount of ether is sent", async function () {
    const [buyer] = await ethers.getSigners();
    const amazonCoin = await ethers.deployContract("AmazonCoin");

    await amazonCoin.connect(buyer).mint(10n, { value: ethers.parseEther("0.001") });

    expect(await amazonCoin.balanceOf(buyer.address)).to.equal(10n);
  });

  it("reverts when the wrong amount of ether is sent", async function () {
    const amazonCoin = await ethers.deployContract("AmazonCoin");

    await expect(amazonCoin.mint(10n, { value: 1n })).to.be.revertedWith(
      "invalid amount of ether",
    );
  });
});
