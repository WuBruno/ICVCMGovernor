import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Roles } from "~/@types";
import { deployContracts } from "~/services/deployment";
import { ICVCMRoles } from "~/typechain";
import { addMember } from "./helper";

describe("Roles Contract", async () => {
  let roles: ICVCMRoles;
  let user: SignerWithAddress;

  beforeEach(async () => {
    // Deploy ICVCMTokenContract
    [, , roles] = await deployContracts();

    [user] = await ethers.getSigners();
  });

  it("should create new member", async () => {
    const role = Roles.Director;
    const name = "Alice";

    await addMember(roles, user.address, role, name);
    const member = await roles.getMember(user.address);
    expect(member.role, "Role does not match").to.equal(role);
    expect(
      ethers.utils.parseBytes32String(member.name),
      "Name does not match"
    ).to.equal(name);
  });
});
