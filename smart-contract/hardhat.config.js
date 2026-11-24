import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { defineConfig, task } from "hardhat/config";

const accountsTask = task("accounts", "Prints the list of accounts")
  .setInlineAction(async (_args, hre) => {
    const { ethers } = await hre.network.getOrCreate();
    const accounts = await ethers.getSigners();

    for (const account of accounts) {
      console.log(account.address);
    }
  })
  .build();

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],
  tasks: [accountsTask],
  solidity: "0.8.28",
});

// networks: {
//   sepolia: {
//     type: "http",
//     url: configVariable("SEPOLIA_RPC_URL"),
//     accounts: [configVariable("WALLET_PRIVATE_KEY")],
//   },
// },
