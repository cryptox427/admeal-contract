require("@nomiclabs/hardhat-waffle");
require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-ethers");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        runs: 200,
        enabled: true,
      },
    },
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://polygon-rpc.com",
      }
    },
    mumbai: {
      url: `https://rpc-mumbai.maticvigil.com/`,
      chainId: 80001,
      accounts: [process.env.ADMEAL_PRIVATE_KEY],
      gas: 3000000,
      // confirmations: 2,    // # of confs to wait between deployments. (default: 0)
      // timeoutBlocks: 2000,  // # of blocks before a deployment times out  (minimum/default: 50)
      // skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    },
    polygon: {
      url: `https://polygon-rpc.com`,
      chainId: 137,
      accounts: [process.env.ADMEAL_PRIVATE_KEY],
      gas: 1000000000,
      // confirmations: 2,    // # of confs to wait between deployments. (default: 0)
      // timeoutBlocks: 2000,  // # of blocks before a deployment times out  (minimum/default: 50)
      // skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    },
  },

  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.ADMEAL_ETHERSCAN_KEY,
  },
};
