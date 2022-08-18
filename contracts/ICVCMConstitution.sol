// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./Upgradable.sol";

contract ICVCMConstitution is OwnableUpgradeable, Upgradable {
    // State Variables
    string private _principles;
    string private _strategies;

    // Events
    event UpdatePrinciples(string currPrinciples, string newPrinciples);
    event UpdateStrategies(string currStrategies, string newStrategies);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Ownable_init();
        __Upgradeable_init();
    }

    // Functions
    function _authorizeUpgrade(address implementationAddress)
        internal
        virtual
        override
        onlyOwner
    {
        super._authorizeUpgrade(implementationAddress);
    }

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
