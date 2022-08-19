// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

import "./Upgradable.sol";

struct EntryOutput {
    uint256 id;
    string value;
}

contract ICVCMConstitution is OwnableUpgradeable, Upgradable {
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.UintSet;
    using CountersUpgradeable for CountersUpgradeable.Counter;

    // State Variables
    CountersUpgradeable.Counter private _principleIdCounter;
    EnumerableSetUpgradeable.UintSet private _principleIds;
    mapping(uint256 => string) private _principles;

    CountersUpgradeable.Counter private _strategyIdCounter;
    EnumerableSetUpgradeable.UintSet private _strategyIds;
    mapping(uint256 => string) private _strategies;

    // Events
    event AddPrinciple(uint256 indexed id, string principle);
    event UpdatePrinciple(
        uint256 indexed id,
        string oldPrinciple,
        string newPrinciple
    );
    event RemovePrinciple(uint256 indexed id, string principle);

    event AddStrategy(uint256 indexed id, string strategy);
    event UpdateStrategy(
        uint256 indexed id,
        string oldStrategy,
        string newStrategy
    );
    event RemoveStrategy(uint256 indexed id, string strategy);

    // Modifiers
    modifier hasPrinciple(uint256 id) {
        require(_principleIds.contains(id), "Invalid Principle Id");
        _;
    }

    modifier hasStrategy(uint256 id) {
        require(_strategyIds.contains(id), "Invalid Strategy Id");
        _;
    }

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

    function getPrinciples() public view returns (EntryOutput[] memory) {
        uint256 principleCount = _principleIds.length();
        EntryOutput[] memory principles = new EntryOutput[](principleCount);

        for (uint256 i = 0; i < principleCount; ++i) {
            uint256 id = _principleIds.at(i);
            principles[i] = EntryOutput(id, _principles[id]);
        }

        return principles;
    }

    function getPrinciple(uint256 id)
        public
        view
        hasPrinciple(id)
        returns (string memory)
    {
        return _principles[id];
    }

    function addPrinciple(string memory principle) public onlyOwner {
        _principleIdCounter.increment();
        uint256 id = _principleIdCounter.current();
        _principleIds.add(id);
        _principles[id] = principle;
        emit AddPrinciple(id, principle);
    }

    function updatePrinciple(uint256 id, string memory newPrinciple)
        public
        onlyOwner
        hasPrinciple(id)
    {
        emit UpdatePrinciple(id, _principles[id], newPrinciple);
        _principles[id] = newPrinciple;
    }

    function removePrinciple(uint256 id) public hasPrinciple(id) {
        emit RemoveStrategy(id, _principles[id]);
        _principleIds.remove(id);
        delete _principles[id];
    }

    function getStrategies() public view returns (EntryOutput[] memory) {
        uint256 strategyCount = _strategyIds.length();
        EntryOutput[] memory strategies = new EntryOutput[](strategyCount);

        for (uint256 i = 0; i < strategyCount; ++i) {
            uint256 id = _strategyIds.at(i);
            strategies[i] = EntryOutput(id, _strategies[id]);
        }

        return strategies;
    }

    function getStrategy(uint256 strategyId)
        public
        view
        returns (string memory)
    {
        return _strategies[strategyId];
    }

    function addStrategy(string memory strategy) public onlyOwner {
        _strategyIdCounter.increment();
        uint256 id = _strategyIdCounter.current();
        _strategyIds.add(id);
        _strategies[id] = strategy;
        emit AddStrategy(id, strategy);
    }

    function updateStrategy(uint256 id, string memory newStrategy)
        public
        onlyOwner
        hasStrategy(id)
    {
        emit UpdatePrinciple(id, _strategies[id], newStrategy);
        _strategies[id] = newStrategy;
    }

    function removeStrategy(uint256 id) public hasStrategy(id) {
        emit RemoveStrategy(id, _strategies[id]);
        _strategyIds.remove(id);
        delete _strategies[id];
    }
}
