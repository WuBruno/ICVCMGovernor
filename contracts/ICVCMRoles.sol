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

contract ICVCMRoles is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    EnumerableSet.AddressSet private _memberSet;
    mapping(address => Member) private _addressToMember;
    ICVCMToken private _token;

    // Contract Address => Function Selector => Role => Boolean
    mapping(address => mapping(bytes4 => mapping(Role => bool)))
        private proposalAuthorization;

    constructor(ICVCMToken tokenAddress) {
        _token = tokenAddress;
    }

    event MemberAdded(address memberAddress, Role role, bytes32 name);

    event MemberRemoved(address memberAddress, Role role, bytes32 name);

    function hasProposalAuthorization(
        address contractAddress,
        bytes4 selector,
        Role role
    ) public view returns (bool) {
        return proposalAuthorization[contractAddress][selector][role];
    }

    function _setProposalAuthorization(
        address contractAddress,
        bytes4 selector,
        Role role,
        bool allow
    ) private {
        proposalAuthorization[contractAddress][selector][role] = allow;
    }

    function setProposalAuthorization(
        address[] memory contracts,
        bytes4[] memory selectors,
        Role[] memory roles,
        bool[] memory allow
    ) public onlyOwner {
        for (uint256 i = 0; i < contracts.length; ++i) {
            _setProposalAuthorization(
                contracts[i],
                selectors[i],
                roles[i],
                allow[i]
            );
        }
    }

    function removeMember(address memberAddress) public onlyOwner {
        if (_addressToMember[memberAddress].role == Role.Director) {
            uint256 tokenId = _token.tokenOfOwnerByIndex(memberAddress, 0);
            _token.burn(tokenId);
        }

        emit MemberRemoved(
            memberAddress,
            _addressToMember[memberAddress].role,
            _addressToMember[memberAddress].name
        );

        _memberSet.remove(memberAddress);
        delete _addressToMember[memberAddress];
    }

    function addMember(
        address memberAddress,
        Role role,
        bytes32 name
    ) public onlyOwner {
        require(!_memberSet.contains(memberAddress), "Member already exists");

        Member memory member = Member(role, name);
        _addMember(memberAddress, member);

        emit MemberAdded(memberAddress, role, name);

        // Mint _token if Director
        if (role == Role.Director) {
            _token.safeMint(memberAddress);
        }
    }

    function _addMember(address memberAddress, Member memory member) private {
        _addressToMember[memberAddress] = member;
        _memberSet.add(memberAddress);
    }

    function getMember(address memberAddress)
        public
        view
        returns (Member memory)
    {
        require(_memberSet.contains(memberAddress), "Member not found");
        return _addressToMember[memberAddress];
    }

    function getMembers() public view returns (MemberOutput[] memory) {
        uint256 memberCount = _memberSet.length();
        MemberOutput[] memory members = new MemberOutput[](memberCount);
        for (uint256 i = 0; i < memberCount; i++) {
            address memberAddress = _memberSet.at(i);
            Member memory member = _addressToMember[memberAddress];
            members[i] = MemberOutput(member.role, member.name, memberAddress);
        }

        return members;
    }
}
