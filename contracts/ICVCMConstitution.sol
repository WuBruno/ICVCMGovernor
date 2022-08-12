// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ICVCMConstitution is Ownable {
    string private _principles = "";
    string private _strategies = "";

    event UpdatePrinciples(string currPrinciples, string newPrinciples);
    event UpdateStrategies(string currStrategies, string newStrategies);

    function getPrinciples() public view returns (string memory) {
        return _principles;
    }

    function getStrategies() public view returns (string memory) {
        return _strategies;
    }

    function setPrinciples(string calldata newPrinciples) public onlyOwner {
        emit UpdatePrinciples(_principles, newPrinciples);
        _principles = newPrinciples;
    }

    function setStrategies(string calldata newStrategies) public onlyOwner {
        emit UpdateStrategies(_strategies, newStrategies);
        _strategies = newStrategies;
    }
}
