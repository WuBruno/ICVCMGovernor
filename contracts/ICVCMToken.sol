// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/draft-ERC721Votes.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ICVCMToken is ERC721, Ownable, EIP712, ERC721Votes {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;
    mapping(address => uint256) private addressToTokenId;

    // solhint-disable-next-line no-empty-blocks
    constructor() ERC721("ICVCMToken", "ICVCM") EIP712("ICVCMToken", "1") {}

    function safeMint(address to) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _delegate(to, to);
        addressToTokenId[to] = tokenId;

        return tokenId;
    }

    function getTokenId(address user) public view returns (uint256) {
        return addressToTokenId[user];
    }

    // Disable function
    function delegate(
        address /*delegatee*/
    ) public pure override {
        revert("disabled");
    }

    // The following functions are overrides required by Solidity.
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Votes) {
        super._afterTokenTransfer(from, to, tokenId);
    }
}
