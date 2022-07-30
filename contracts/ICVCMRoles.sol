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

    EnumerableSet.AddressSet private memberSet;
    mapping(address => Member) private addressToMember;
    ICVCMToken private token;

    constructor(ICVCMToken tokenAddress) {
        token = tokenAddress;
    }

    function removeMember(address memberAddress) public onlyOwner {
        if (addressToMember[memberAddress].role == Role.Director) {
            uint256 tokenId = token.tokenOfOwnerByIndex(memberAddress, 0);
            token.burn(tokenId);
        }

        memberSet.remove(memberAddress);
        delete addressToMember[memberAddress];
    }

    function addMember(
        address memberAddress,
        Role role,
        bytes32 name
    ) public onlyOwner {
        require(!memberSet.contains(memberAddress), "Member already exists");

        Member memory member = Member(role, name);
        _addMemberData(memberAddress, member);

        // Mint token if Director
        if (role == Role.Director) {
            token.safeMint(memberAddress);
        }
    }

    function _addMemberData(address memberAddress, Member memory member)
        private
    {
        addressToMember[memberAddress] = member;
        memberSet.add(memberAddress);
    }

    function getMember(address memberAddress)
        public
        view
        returns (Member memory)
    {
        require(memberSet.contains(memberAddress), "Member not found");
        return addressToMember[memberAddress];
    }

    function getMembers() public view returns (MemberOutput[] memory) {
        uint256 memberCount = memberSet.length();
        MemberOutput[] memory members = new MemberOutput[](memberCount);
        for (uint256 i = 0; i < memberCount; i++) {
            address memberAddress = memberSet.at(i);
            Member memory member = addressToMember[memberAddress];
            members[i] = MemberOutput(member.role, member.name, memberAddress);
        }

        return members;
    }
}
