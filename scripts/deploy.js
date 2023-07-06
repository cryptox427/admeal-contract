const { ethers } = require("hardhat");
const {pretty} = require("literal-fs");

async function main() {
  try {
    const asArray = Object.entries(process.env);
    const justStrings = asArray.filter(([key, value]) => key.indexOf(process.env.PREFIX) > -1);
    pretty(JSON.stringify(justStrings));
    await sleep(5000);

    // const Noodle = await ethers.getContractFactory("Noodle");
    // const noodle = await Noodle.deploy();
    // await noodle.deployed();

    // console.log(`🎉 Noodle Deployed to ${noodle.address}`);

    const Admeal = await ethers.getContractFactory("Admeal");
    const admeal = await Admeal.deploy('0x1155b9F38BeB4fc275A22aE62DE984042A7aB1c9');
    await admeal.deployed();
  
    console.log(`🎉 Admeal Deployed to ${admeal.address}`);
    
  } catch (e) {
    console.log('get error while deploying....');
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
console.log("Deploying Admeal NFT Contact.... Wait please....");
setTimeout(() => {
  main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
}, 1000);

const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms)
  })
}