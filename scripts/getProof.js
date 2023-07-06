const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const whitelist = require('./data/whitelist.json')
const address = "0xFe94606e19Ed899cDCc2f984FBe704CC6198451e";

const whitelistMerkleTree = new MerkleTree(whitelist.map((address) => keccak256(address)), keccak256, { sortPairs: true});
const whitelistMerkleRoot = whitelistMerkleTree.getHexRoot();

console.log('merkle root----', whitelistMerkleRoot);

const whitelistedUserLeaf = keccak256(address);
const whitelistMerkleProof = whitelistMerkleTree.getHexProof(whitelistedUserLeaf);

console.log('merkle proof----', whitelistMerkleProof);
