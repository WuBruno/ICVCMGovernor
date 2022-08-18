// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../ICVCMConstitution.sol";

contract ICVCMConstitutionV2 is ICVCMConstitution {
    function getData() public view returns (string memory, string memory) {
        return (getPrinciples(), getStrategies());
    }
}
