// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./ICVCMToken.sol";

enum Role {
    Director,
    Expert,
    Secretariat
}

struct Member {
    Role role;
    bytes32 name;
}

contract ICVCMRoles is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    EnumerableSet.AddressSet private memberSet;
    mapping(address => Member) private addressToMember;
    ICVCMToken private token;

    constructor(ICVCMToken tokenAddress) {
        token = tokenAddress;
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
        return addressToMember[memberAddress];
    }
}
