// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract Admeal is ERC721Enumerable, Ownable {
    using MerkleProof for bytes32[];
    using Strings for uint256;

    // Constants
    uint256 public constant MAX_SUPPLY = 3000;
    uint256 public constant DISCOUNT_SUUPLY = 1500;

    // Price
    uint256 public MINT_PRICE = 48 ether;
    uint256 public MINT_PRICE_DISCOUNT = 43.2 ether;

    // Noodle NFT Collection Address
    address public Noodle_Collection;

    // Merkle roots for whitelisted and partner whitelisted addresses
    bytes32 public whitelistedMerkleRoot;

    // Counter for sale
    uint256 public discount_sale = 0;
    uint256 public sale_limit = 1000;
    bool public saleOn = false;

    // Mapping for whitelisted users
    mapping(address => bool) public whitelistMinted;

    // Limit per wallet
    uint8 public maxPerWallet = 5;

    // Metadata 
    string public uriPrefix = "https://plum-elderly-panther-953.mypinata.cloud/ipfs/QmRkEHsUSs4pUPo7EKcDMxfvtXKfbxiv8jGN4MfbSiKeB4/";
    string public uriSuffix = ".json";

    // Events
    event SetSale (bool _sale);
    event Withdrawn (address _to, uint256 amount);
    event Mint(address _to, uint256 amount);
    event DiscountMint(address _to, uint amount);
    event WhitelistMint(address _to);

    constructor(address _noodleCollection) ERC721("Admeal Ramen NFT", "ARNFT") {
        Noodle_Collection = _noodleCollection;
    }

    // Mint NFTs for normal users
    function mint(uint256 numberOfTokens) external payable {
        require(saleOn && totalSupply() + numberOfTokens <= sale_limit, "Sale Not Available");
        require(totalSupply() + numberOfTokens <= MAX_SUPPLY, "Exceeds maximum supply");
        require(msg.value == numberOfTokens * MINT_PRICE, "Incorrect Matic value");
        require(balanceOf(msg.sender) + numberOfTokens <= maxPerWallet, "Exceed max mint per wallet");

        for (uint256 i = 0; i < numberOfTokens; i++) {
            uint256 tokenId = totalSupply() + 1;
            _safeMint(msg.sender, tokenId);
        }
        emit Mint(msg.sender, numberOfTokens);
    }

    // Mint NFTs for Noodle NFT holders
    function discountMint(uint256 numberOfTokens) external payable {
        require(saleOn && totalSupply() + numberOfTokens <= sale_limit, "Sale Not Available");
        require(IERC721(Noodle_Collection).balanceOf(msg.sender) >= 1, "Not Noodle holder");
        require(totalSupply() + numberOfTokens <= MAX_SUPPLY, "Exceeds maximum supply");
        require(discount_sale + numberOfTokens <= DISCOUNT_SUUPLY, "Exceed the Discount Supply");
        require(balanceOf(msg.sender) + numberOfTokens <= maxPerWallet, "Exceed max mint per wallet");
        require(msg.value == numberOfTokens * MINT_PRICE_DISCOUNT, "Incorrect Matic value");

        for (uint256 i = 0; i < numberOfTokens; i++) {
            uint256 tokenId = totalSupply() + 1;
            _safeMint(msg.sender, tokenId);
            discount_sale++;
        }
        emit DiscountMint(msg.sender, numberOfTokens);
    }

    // Mint a NFT for whitelisted users
    function whitelistMint(bytes32[] calldata merkleProof) external {
        require(saleOn && totalSupply() + 1 <= sale_limit, "Sale Not Available");
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(
            MerkleProof.verify(merkleProof, whitelistedMerkleRoot, leaf),
            "Invalid Merkle proof"
        );
        require(!whitelistMinted[msg.sender], "Already minted");
        require(balanceOf(msg.sender) == 0, "Only 1 NFT can be free minted");

        whitelistMinted[msg.sender] = true;
        uint256 tokenId = totalSupply() + 1;
        _safeMint(msg.sender, tokenId);
        emit WhitelistMint(msg.sender);
    }

    // Mint NFTs for the owner
    function ownerMint(uint256 numberOfTokens) external onlyOwner {
        require(totalSupply() + numberOfTokens <= MAX_SUPPLY, "Exceeds maximum supply");

        for (uint256 i = 0; i < numberOfTokens; i++) {
            uint256 tokenId = totalSupply() + 1;
            _safeMint(owner(), tokenId);
        }
    }

    // Withdraw contract balance
    function withdrawBalance(address _to) external onlyOwner {
        require(!saleOn, "Now In Sale");
        uint256 balance = address(this).balance;
        payable(_to).transfer(balance);
        emit Withdrawn(_to, balance);
    }

    // Set the Merkle root for whitelisted addresses
    function setWhitelistedMerkleRoot(bytes32 root) external onlyOwner {
        whitelistedMerkleRoot = root;
    }

    // Set the Noodle collection
    function setNoodleCollection(address _noodle) external onlyOwner {
        require(_noodle != address(0), "Cannot Set Zero Address");
        Noodle_Collection = _noodle;
    }

    // Set Mint Price
    function setPrice(uint256 _mintPrice, uint256 _mintPriceDiscount) external onlyOwner {
        MINT_PRICE = _mintPrice;
        MINT_PRICE_DISCOUNT = _mintPriceDiscount;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return uriPrefix;
    }

    function setUriPrefix(string memory _uriPrefix) external onlyOwner {
        uriPrefix = _uriPrefix;
    }

    function setUriSuffix(string memory _uriSuffix) external onlyOwner {
        uriSuffix = _uriSuffix;
    }

    function tokenURI(uint256 _tokenId) public view virtual override returns (string memory) {
        require(_exists(_tokenId), "Non-existent token given!");

        uint id = _tokenId;
        string memory currentBaseURI = _baseURI();
        return bytes(currentBaseURI).length > 0
        ? string(abi.encodePacked(currentBaseURI, id.toString(), uriSuffix))
        : "";
    }

    function setSale(bool _sale) external onlyOwner {
        saleOn = _sale;
        emit SetSale(_sale);
    }

    function setSaleLimit(uint256 _saleLimit) external onlyOwner {
        sale_limit = _saleLimit;
    }
}
