// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ICVCMConstitution is Ownable {
    string private principles = "";
    string private strategies = "";

    event UpdatePrinciples(string currPrinciples, string newPrinciples);
    event UpdateStrategies(string currStrategies, string newStrategies);

    function getPrinciples() public view returns (string memory) {
        return principles;
    }

    function getStrategies() public view returns (string memory) {
        return strategies;
    }

    function setPrinciples(string calldata newPrinciples) public onlyOwner {
        emit UpdatePrinciples(principles, newPrinciples);
        principles = newPrinciples;
    }

    function setStrategies(string calldata newStrategies) public onlyOwner {
        emit UpdateStrategies(strategies, newStrategies);
        strategies = newStrategies;
    }
}
