// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "./ICVCMConstitution.sol";
import "./ICVCMRoles.sol";

contract ICVCMGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction
{
    ICVCMConstitution private constitution;
    ICVCMRoles private roles;

    constructor(
        IVotes _token,
        ICVCMConstitution _constitution,
        ICVCMRoles _roles
    )
        Governor("ICVCMGovernor")
        GovernorSettings(
            0, /* 0 block */
            273, /* 1 hour */
            0
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4)
    {
        constitution = _constitution;
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

    modifier onlyRegulator() {
        require(
            roles.getMember(msg.sender).role == Role.Regulator,
            "Execute restricted to Regulator"
        );
        _;
    }
}
