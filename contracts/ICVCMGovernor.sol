// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/governance/GovernorUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorSettingsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorCountingSimpleUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesQuorumFractionUpgradeable.sol";

import "./ICVCMRoles.sol";
import "./GovernorAuthorization.sol";
import "./Upgradable.sol";

contract ICVCMGovernor is
    Upgradable,
    GovernorUpgradeable,
    GovernorSettingsUpgradeable,
    GovernorCountingSimpleUpgradeable,
    GovernorVotesUpgradeable,
    GovernorVotesQuorumFractionUpgradeable,
    GovernorAuthorization
{
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(IVotesUpgradeable _token, ICVCMRoles _roles)
        public
        initializer
    {
        __Upgradeable_init();
        __Governor_init("ICVCMGovernor");
        __GovernorSettings_init(
            0, /* 0 block */
            45818, /* 1 week */
            0
        );
        __GovernorCountingSimple_init();
        __GovernorVotes_init(_token);
        __GovernorVotesQuorumFraction_init(50);
        __GovernorAuthorization_init(_roles);
    }

    function _authorizeUpgrade(address implementationAddress)
        internal
        virtual
        override
        onlyGovernance
    {
        super._authorizeUpgrade(implementationAddress);
    }

    function COUNTING_MODE()
        public
        pure
        virtual
        override(IGovernorUpgradeable, GovernorCountingSimpleUpgradeable)
        returns (string memory)
    {
        return "support=bravo&quorum=against,for,abstain";
    }

    // GovernorCountingSimple does not contribute againstVotes to quorum.
    function _quorumReached(uint256 proposalId)
        internal
        view
        virtual
        override(GovernorUpgradeable, GovernorCountingSimpleUpgradeable)
        returns (bool)
    {
        (
            uint256 againstVotes,
            uint256 forVotes,
            uint256 abstainVotes
        ) = proposalVotes(proposalId);

        return
            quorum(proposalSnapshot(proposalId)) <=
            againstVotes + forVotes + abstainVotes;
    }

    function state(uint256 proposalId)
        public
        view
        virtual
        override
        returns (ProposalState)
    {
        ProposalState _state = super.state(proposalId);

        // Check if possible to end proposal early
        if (_state == ProposalState.Active) {
            (
                uint256 againstVotes,
                uint256 forVotes,
                uint256 abstainVotes
            ) = proposalVotes(proposalId);

            // Check if all votes are submitted
            if (
                againstVotes + forVotes + abstainVotes ==
                token.getPastTotalSupply(proposalSnapshot(proposalId))
            ) {
                // Then calculate vote results
                if (_quorumReached(proposalId) && _voteSucceeded(proposalId)) {
                    return ProposalState.Succeeded;
                } else {
                    return ProposalState.Defeated;
                }
            }
        }

        return _state;
    }

    function _voteSucceeded(uint256 proposalId)
        internal
        view
        virtual
        override(GovernorUpgradeable, GovernorCountingSimpleUpgradeable)
        returns (bool)
    {
        (uint256 againstVotes, uint256 forVotes, ) = proposalVotes(proposalId);

        return forVotes >= 2 * againstVotes;
    }

    function votingDelay()
        public
        view
        override(IGovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(IGovernorUpgradeable, GovernorSettingsUpgradeable)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(IGovernorUpgradeable, GovernorVotesQuorumFractionUpgradeable)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function proposalThreshold()
        public
        view
        override(GovernorUpgradeable, GovernorSettingsUpgradeable)
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
    ) public payable virtual override returns (uint256) {
        return super.execute(targets, values, calldatas, descriptionHash);
    }

    function cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash,
        string calldata reason
    ) public virtual onlyRegulator returns (uint256) {
        return
            super._cancel(targets, values, calldatas, descriptionHash, reason);
    }
}
