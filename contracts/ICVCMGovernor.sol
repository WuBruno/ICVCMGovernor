// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "./ICVCMRoles.sol";
import "./ICVCMGovernorAuthorization.sol";

// block time
contract ICVCMGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    ICVCMGovernorAuthorization
{
    constructor(IVotes _token, ICVCMRoles _roles)
        Governor("ICVCMGovernor")
        GovernorSettings(
            0, /* 0 block */
            45818, /* 1 week, 13.2 blocks/s */
            0
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(50)
        ICVCMGovernorAuthorization(_roles)
    {}

    function COUNTING_MODE()
        public
        pure
        virtual
        override(IGovernor, GovernorCountingSimple)
        returns (string memory)
    {
        return "support=bravo&quorum=against,for,abstain";
    }

    // GovernorCountingSimple does not contribute againstVotes to quorum.
    function _quorumReached(uint256 proposalId)
        internal
        view
        virtual
        override(Governor, GovernorCountingSimple)
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
        override(Governor, GovernorCountingSimple)
        returns (bool)
    {
        (uint256 againstVotes, uint256 forVotes, ) = proposalVotes(proposalId);

        return forVotes >= 2 * againstVotes;
    }

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
    ) public payable virtual override returns (uint256) {
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
}
