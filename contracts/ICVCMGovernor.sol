// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "./ICVCMRoles.sol";
import "hardhat/console.sol";

contract ICVCMGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction
{
    ICVCMRoles private roles;

    constructor(IVotes _token, ICVCMRoles _roles)
        Governor("ICVCMGovernor")
        GovernorSettings(
            0, /* 0 block */
            273, /* 1 hour */
            0
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4)
    {
        roles = _roles;
    }

    // The following functions are overrides required by Solidity.

    function votingDelay()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(IGovernor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    )
        public
        virtual
        override
        proposeAuthorisation(targets, calldatas)
        returns (uint256)
    {
        return super.propose(targets, values, calldatas, description);
    }

    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public payable virtual override onlyRegulator returns (uint256) {
        return super.execute(targets, values, calldatas, descriptionHash);
    }

    function cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public virtual onlyRegulator returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    modifier proposeAuthorisation(
        address[] memory targets,
        bytes[] memory calldatas
    ) {
        Role memberRole = roles.getMember(msg.sender).role;
        for (uint256 i = 0; i < targets.length; ++i) {
            require(
                roles.hasProposalAuthorization(
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
        require(
            roles.getMember(msg.sender).role == Role.Regulator,
            "Execute restricted to Regulator"
        );
        _;
    }
}
