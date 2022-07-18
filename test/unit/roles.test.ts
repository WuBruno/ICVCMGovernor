import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Roles } from "~/@types";
import { deployContracts } from "~/services/deployment";
import { ICVCMRoles, ICVCMToken } from "~/typechain";
import { addMember } from "../helper";

describe("Roles Contract", async () => {
  let roles: ICVCMRoles;
  let token: ICVCMToken;
  let user: SignerWithAddress;
  const role = Roles.Director;
  const name = "Alice";

  beforeEach(async () => {
    [user] = await ethers.getSigners();

    [token, , roles] = await deployContracts(undefined, false);
    await addMember(roles, user.address, role, name);
  });

  it("should add member", async () => {
    const member = await roles.getMember(user.address);
    expect(member.role, "Role does not match").to.equal(role);
    expect(
      ethers.utils.parseBytes32String(member.name),
      "Name does not match"
    ).to.equal(name);
    expect(await token.balanceOf(user.address)).to.equal(1);
  });

  it("should remove member", async () => {
    const tx = await roles.removeMember(user.address);
    await tx.wait();

    expect(roles.getMember(user.address)).to.be.revertedWith(
      "Member not found"
    );

    expect(await token.balanceOf(user.address)).to.equal(0);
  });
});
