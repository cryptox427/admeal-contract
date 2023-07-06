const { ethers } = require("hardhat");
const { expect } = require("chai");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

describe("Admeal", function () {
  let admeal;
  let noodle;
  let owner;
  let whitelistedUser;
  let whitelistedUsers;
  let otherUser, otherUser2;
  let whitelistMerkleTree;
  let partners;

  before(async function () {
    [owner, otherUser, otherUser2, ...whitelistedUsers] = await ethers.getSigners();
    [whitelistedUser, ...partners] = whitelistedUsers;


    const Noodle = await ethers.getContractFactory("Noodle");
    noodle = await Noodle.deploy();
    await noodle.deployed();

    const Admeal = await ethers.getContractFactory("Admeal");
    admeal = await Admeal.deploy(noodle.address);
    await admeal.deployed();

    // Create the whitelist addresses
    const whitelistAddresses = whitelistedUsers.map((user) => user.address);

    // Generate Merkle trees for the whitelist addresses
    whitelistMerkleTree = new MerkleTree(whitelistAddresses.map((address) => keccak256(address)), keccak256, { sortPairs: true});

    // Get the Merkle roots for the whitelist addresses
    const whitelistMerkleRoot = whitelistMerkleTree.getHexRoot();

    // Set the Merkle roots for whitelisted addresses
    await admeal.setWhitelistedMerkleRoot(whitelistMerkleRoot);

    // // Set Noodle Collection
    // await admeal.setNoodleCollection(noodle.address);

    // Set Sale On
    await admeal.setSale(true);
  });

  it("should mint free nft to whitelisted users", async function() {
    const initialSupply = await admeal.totalSupply();
    const whitelistedUserAddress = whitelistedUsers[0].address;
    const whitelistedUserLeaf = keccak256(whitelistedUserAddress);
    const whitelistMerkleProof = whitelistMerkleTree.getHexProof(whitelistedUserLeaf);
    await expect(admeal.connect(whitelistedUsers[0]).whitelistMint(whitelistMerkleProof))
    .to.emit(admeal, "Transfer")
      .withArgs(ethers.constants.AddressZero, whitelistedUsers[0].address, initialSupply.add(1))

    await expect(admeal.connect(whitelistedUsers[0]).whitelistMint(whitelistMerkleProof))
    .to.revertedWith("Already minted")
  });

  it("should mint NFTs for noodle owners", async function () {
    const numberOfTokens = 3;
    // const mintPrice = ethers.utils.parseEther("0.05");
    const mintPrice = await admeal.MINT_PRICE_DISCOUNT();
    const initialSupply = await admeal.totalSupply();

    await noodle.mint(1, otherUser.address);

    await expect(admeal.connect(otherUser).discountMint(numberOfTokens, {value: mintPrice.mul(numberOfTokens)}))
      .to.emit(admeal, "Transfer")
      .withArgs(ethers.constants.AddressZero, otherUser.address, initialSupply.add(1))
      .to.emit(admeal, "Transfer")
      .withArgs(ethers.constants.AddressZero, otherUser.address, initialSupply.add(numberOfTokens));

    const finalSupply = await admeal.totalSupply();
    expect(finalSupply).to.equal(initialSupply.add(numberOfTokens));
    expect(await admeal.balanceOf(otherUser.address)).to.equal(numberOfTokens);
    expect(await ethers.provider.getBalance(admeal.address)).to.equal(mintPrice.mul(numberOfTokens));

    await expect(admeal.connect(otherUser2).discountMint(numberOfTokens, {value: mintPrice.mul(numberOfTokens)}))
      .to.revertedWith("Not Noodle holder");

    const maxPerWallet = await admeal.maxPerWallet();
    await expect(admeal.connect(otherUser).discountMint(maxPerWallet - numberOfTokens + 1, {value: mintPrice.mul(maxPerWallet - numberOfTokens + 1)}))
      .to.revertedWith("Exceed max mint per wallet");

    // const discountSupply = await admeal.DISCOUNT_SUUPLY();
    // const discountLeft = discountSupply - initialSupply.add(numberOfTokens);
    // for (let i = 1; i <= discountLeft; i++) {
    //   await admeal.connect(otherUser).discountMint(1, {value: mintPrice.mul(1)});
    // }

    // await expect(admeal.connect(otherUser).discountMint(numberOfTokens, {value: mintPrice.mul(numberOfTokens)}))
    // .to.revertedWith("Exceed the Discount Supply")

  });

  it("should mint NFTs for normal users", async function() {
    const numberOfTokens = 3;
    // const mintPrice = ethers.utils.parseEther("0.1");
    const mintPrice = await admeal.MINT_PRICE();
    const initialSupply = await admeal.totalSupply();

    await expect(admeal.connect(otherUser2).mint(numberOfTokens, {value: mintPrice.mul(numberOfTokens)}))
      .to.emit(admeal, "Transfer")
      .withArgs(ethers.constants.AddressZero, otherUser2.address, initialSupply.add(1))
      .to.emit(admeal, "Transfer")
      .withArgs(ethers.constants.AddressZero, otherUser2.address, initialSupply.add(numberOfTokens));

    const maxPerWallet = await admeal.maxPerWallet();
    await expect(admeal.connect(otherUser2).mint(maxPerWallet - numberOfTokens + 1, {value: mintPrice.mul(maxPerWallet - numberOfTokens + 1)}))
      .to.revertedWith("Exceed max mint per wallet");

  });


  it("should not allow minting more than the maximum supply", async function () {
    const numberOfTokens = await admeal.MAX_SUPPLY();
    const sale_limit = await admeal.sale_limit();
    const initialSupply = await admeal.totalSupply();

    await expect(admeal.connect(whitelistedUser).mint(sale_limit.sub(initialSupply).add(1))).to.be.revertedWith(
      "Sale Not Available"
    );

  });

  it("should not allow minting without the correct Ether value", async function () {
    const numberOfTokens = 2;

    await expect(admeal.connect(whitelistedUser).mint(numberOfTokens)).to.be.revertedWith("Incorrect Matic value");
  });

  it("should allow the owner to mint NFTs for free", async function () {
    const numberOfTokens = 2;
    const initialSupply = await admeal.totalSupply();

    await expect(admeal.connect(owner).ownerMint(numberOfTokens))
      .to.emit(admeal, "Transfer")
      .withArgs(ethers.constants.AddressZero, owner.address, initialSupply.add(1))
      .to.emit(admeal, "Transfer")
      .withArgs(ethers.constants.AddressZero, owner.address, initialSupply.add(numberOfTokens));

    const finalSupply = await admeal.totalSupply();
    expect(finalSupply).to.equal(initialSupply.add(numberOfTokens));
    expect(await admeal.balanceOf(owner.address)).to.equal(numberOfTokens);
  });

  // it("should not allow non-owners to mint NFTs for free", async function () {
  //   await expect(admeal.connect(whitelistedUser).ownerMint(1)).to.be.revertedWith("Ownable: caller is not the owner");
  // });

  it("should allow the owner to withdraw the contract balance", async function () {
    await admeal.setSale(false);
    const initialBalance = await ethers.provider.getBalance(otherUser.address);
    const contractBalance = await ethers.provider.getBalance(admeal.address);

    await admeal.connect(owner).withdrawBalance(otherUser.address);

    const finalBalance = await ethers.provider.getBalance(otherUser.address);
    expect(finalBalance.sub(initialBalance)).to.equal(contractBalance);
  });
});
