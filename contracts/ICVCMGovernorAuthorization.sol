// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "./ICVCMRoles.sol";

abstract contract ICVCMGovernorAuthorization {
    ICVCMRoles private _roles;

    constructor(ICVCMRoles roles) {
        _roles = roles;
    }

    function _onlyMember(Role role, string memory errMsg) private view {
        require(_roles.getMember(msg.sender).role == role, errMsg);
    }

    modifier proposeAuthorisation(
        address[] memory targets,
        bytes[] memory calldatas
    ) {
        Role memberRole = _roles.getMember(msg.sender).role;

        for (uint256 i = 0; i < targets.length; ++i) {
            require(
                _roles.hasProposalAuthorization(
                    targets[i],
                    bytes4(calldatas[i]),
                    memberRole
                ),
                "Unauthorized"
            );
        }
        _;
    }

    modifier onlyRegulator() {
        _onlyMember(Role.Regulator, "Function restricted to Regulator");
        _;
    }
}
