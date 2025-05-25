// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract BasicNft is ERC721 {
    uint256 private s_tokenCounter;
    mapping(uint256 => string) private s_tokenURIs;

    constructor() ERC721("Pokemon", "PKM") {
        s_tokenCounter = 0;
    }

    function mintNft(string memory tokenUri) public returns (uint256) {
        _safeMint(msg.sender, s_tokenCounter);
        s_tokenURIs[s_tokenCounter] = tokenUri;
        s_tokenCounter++;
        return s_tokenCounter;
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        return s_tokenURIs[tokenId];
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}
