// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

contract Launchpad is ERC721, Ownable, ERC2981 {
    string private _baseTokenURI;
    uint256 public totalSupply;
    address public creator;

    event Mint(address indexed to, uint256 indexed tokenId);

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseTokenURI_,
        address royaltyRecipient_,
        uint96 royaltyBps_ // e.g., 500 = 5%
    ) ERC721(name_, symbol_) {
        _baseTokenURI = baseTokenURI_;
        creator = msg.sender;
        _setDefaultRoyalty(royaltyRecipient_, royaltyBps_);
    }

    function mint(address to) public returns (uint256) {
        uint256 tokenId = totalSupply + 1;
        _safeMint(to, tokenId);
        totalSupply = tokenId;
        emit Mint(to, tokenId);
        return tokenId;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    // Allow owner to update base URI if needed
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
    }

    // Allow owner to update royalty info
    function setRoyalty(address recipient, uint96 bps) external onlyOwner {
        _setDefaultRoyalty(recipient, bps);
    }

    // The following functions are overrides required by Solidity.
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
} 