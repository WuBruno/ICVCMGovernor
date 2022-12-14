// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

abstract contract Upgradable is Initializable, UUPSUpgradeable {
    uint256 private version;

    event ContractUpgraded(uint256 version);

    // solhint-disable-next-line func-name-mixedcase
    function __Upgradeable_init() internal onlyInitializing {
        __UUPSUpgradeable_init();
        incrementVersion();
    }

    function _authorizeUpgrade(address) internal virtual override {
        incrementVersion();
    }

    function getVersion() public view returns (uint256) {
        return version;
    }

    function incrementVersion() public {
        version += 1;
        emit ContractUpgraded(version);
    }
}
