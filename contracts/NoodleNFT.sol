// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract Noodle is ERC721Enumerable, Ownable {

    // Constants
    uint256 public constant MAX_SUPPLY = 3000;

    constructor() ERC721("Noodle", "NOODLE") {
    }

    // Mint NFTs for the owner
    function mint(uint256 numberOfTokens, address _to) external onlyOwner {
        require(totalSupply() + numberOfTokens <= MAX_SUPPLY, "Exceeds maximum supply");

        for (uint256 i = 0; i < numberOfTokens; i++) {
            uint256 tokenId = totalSupply() + 1;
            _safeMint(_to, tokenId);
        }
    }

    // Withdraw contract balance
    function withdrawBalance(address _to) external onlyOwner {
        uint256 balance = address(this).balance;
        payable(_to).transfer(balance);
    }
}
