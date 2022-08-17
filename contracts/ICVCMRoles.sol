// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./ICVCMToken.sol";

enum Role {
    Director,
    Expert,
    Secretariat,
    Regulator
}

struct Member {
    Role role;
    bytes32 name;
}

struct MemberOutput {
    Role role;
    bytes32 name;
    address memberAddress;
}

struct ProposalAuthorization {
    address contractAddress;
    bytes4 selector;
    Role role;
}

contract ICVCMRoles is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    EnumerableSet.AddressSet private _memberSet;
    mapping(address => Member) private _members;
    ICVCMToken private _token;

    ProposalAuthorization[] private _allProposalAuthorization;

    // Contract Address => Function Selector => Role => Boolean
    mapping(address => mapping(bytes4 => mapping(Role => uint256)))
        private _proposalAuthorization;

    constructor(ICVCMToken tokenAddress) {
        _token = tokenAddress;
    }

    event MemberAdded(address memberAddress, Role role, bytes32 name);

    event MemberRemoved(address memberAddress, Role role, bytes32 name);

    event ProposalAuthorizationAdded(
        address contractAddress,
        bytes4 selector,
        Role role
    );

    event ProposalAuthorizationRemoved(
        address contractAddress,
        bytes4 selector,
        Role role
    );

    function getProposalAuthorization(
        address contractAddress,
        bytes4 selector,
        Role role
    ) public view returns (uint256) {
        return _proposalAuthorization[contractAddress][selector][role];
    }

    function hasProposalAuthorization(
        address contractAddress,
        bytes4 selector,
        Role role
    ) public view returns (bool) {
        return _proposalAuthorization[contractAddress][selector][role] > 0;
    }

    function batchAddProposalAuthorization(
        address[] memory contracts,
        bytes4[] memory selectors,
        Role[] memory roles
    ) public onlyOwner {
        for (uint256 i = 0; i < contracts.length; ++i) {
            addProposalAuthorization(contracts[i], selectors[i], roles[i]);
        }
    }

    function addProposalAuthorization(
        address contractAddress,
        bytes4 selector,
        Role role
    ) public onlyOwner {
        emit ProposalAuthorizationAdded(contractAddress, selector, role);
        _allProposalAuthorization.push(
            ProposalAuthorization(contractAddress, selector, role)
        );

        _proposalAuthorization[contractAddress][selector][
            role
        ] = _allProposalAuthorization.length;
    }

    function removeProposalAuthorization(
        address contractAddress,
        bytes4 selector,
        Role role
    ) public onlyOwner {
        emit ProposalAuthorizationRemoved(contractAddress, selector, role);
        // Get items for swap
        uint256 index = _proposalAuthorization[contractAddress][selector][
            role
        ] - 1;
        ProposalAuthorization storage last = _allProposalAuthorization[
            _allProposalAuthorization.length - 1
        ];

        // Swap
        _allProposalAuthorization[index] = last;
        _proposalAuthorization[last.contractAddress][last.selector][
            last.role
        ] = index;

        // Delete
        _allProposalAuthorization.pop();
        delete _proposalAuthorization[contractAddress][selector][role];
    }

    function getProposalAuthorizations()
        public
        view
        returns (ProposalAuthorization[] memory)
    {
        return _allProposalAuthorization;
    }

    function addMember(
        address memberAddress,
        Role role,
        bytes32 name
    ) public onlyOwner {
        require(!_memberSet.contains(memberAddress), "Member already exists");

        Member memory member = Member(role, name);
        _addMember(memberAddress, member);

        // Mint _token if Director
        if (role == Role.Director) {
            _token.safeMint(memberAddress);
        }
    }

    function _addMember(address memberAddress, Member memory member) private {
        _members[memberAddress] = member;
        _memberSet.add(memberAddress);

        emit MemberAdded(memberAddress, member.role, member.name);
    }

    function removeMember(address memberAddress) public onlyOwner {
        require(_memberSet.contains(memberAddress), "Member does not exist");

        _removeMember(memberAddress);

        if (_members[memberAddress].role == Role.Director) {
            uint256 tokenId = _token.tokenOfOwnerByIndex(memberAddress, 0);
            _token.burn(tokenId);
        }
    }

    function _removeMember(address memberAddress) private {
        _memberSet.remove(memberAddress);
        delete _members[memberAddress];

        emit MemberRemoved(
            memberAddress,
            _members[memberAddress].role,
            _members[memberAddress].name
        );
    }

    function getMember(address memberAddress)
        public
        view
        returns (Member memory)
    {
        require(_memberSet.contains(memberAddress), "Member not found");
        return _members[memberAddress];
    }

    function getMembers() public view returns (MemberOutput[] memory) {
        uint256 memberCount = _memberSet.length();
        MemberOutput[] memory members = new MemberOutput[](memberCount);
        for (uint256 i = 0; i < memberCount; i++) {
            address memberAddress = _memberSet.at(i);
            Member memory member = _members[memberAddress];
            members[i] = MemberOutput(member.role, member.name, memberAddress);
        }

        return members;
    }
}
