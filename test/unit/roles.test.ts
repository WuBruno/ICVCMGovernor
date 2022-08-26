import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Roles } from "~/@types";
import { deployContracts } from "~/services/deployment";
import { ICVCMGovernor, ICVCMRoles, ICVCMToken } from "~/typechain";
import { addMember } from "../helper";

describe("Roles Contract", async () => {
  let governor: ICVCMGovernor;
  let roles: ICVCMRoles;
  let token: ICVCMToken;
  let director: SignerWithAddress;
  let expert: SignerWithAddress;
  let nonMember: SignerWithAddress;
  const role = Roles.Director;
  const name = "Alice";

  beforeEach(async () => {
    [director, expert, nonMember] = await ethers.getSigners();

    [token, governor, roles] = await deployContracts(undefined, false);
    await addMember(roles, director.address, role, name);
    await addMember(roles, expert.address, Roles.Expert, "Eve");
  });

  it("should add member", async () => {
    const member = await roles.getMember(director.address);
    expect(member.role, "Role does not match").to.equal(role);
    expect(
      ethers.utils.parseBytes32String(member.name),
      "Name does not match"
    ).to.equal(name);
    expect(await token.balanceOf(director.address)).to.equal(1);
  });

  it("should remove director and its voting token", async () => {
    const tx = await roles.removeMember(director.address);
    await tx.wait();

    expect(roles.getMember(director.address)).to.be.revertedWith(
      "Member not found"
    );

    expect(await token.balanceOf(director.address)).to.equal(0);
  });

  it("should remove non-director", async () => {
    const tx = await roles.removeMember(expert.address);
    await tx.wait();

    expect(roles.getMember(expert.address)).to.be.revertedWith(
      "Member not found"
    );
  });

  it("should fail to remove non-existing member", async () => {
    expect(roles.removeMember(nonMember.address)).to.revertedWith(
      "Member not found"
    );
  });

  it("should get an array of members", async () => {
    const members = await roles.getMembers();
    expect(ethers.utils.parseBytes32String(members[0].name)).to.equal(name);
    expect(members[0].role).to.equal(role);
    expect(members[0].memberAddress).to.equal(director.address);
  });

  describe("Proposal Authorization Tests", () => {
    it("should delete add member proposal authorization for director", async () => {
      await roles.removeProposalAuthorization(
        roles.address,
        roles.interface.getSighash("addMember"),
        Roles.Director
      );

      expect(
        await roles.hasProposalAuthorization(
          roles.address,
          roles.interface.getSighash("addMember"),
          Roles.Director
        )
      ).to.equal(false);

      expect(
        await roles.hasProposalAuthorization(
          governor.address,
          governor.interface.getSighash("setVotingPeriod"),
          Roles.Director
        )
      );
    });
    it("should get all current proposalAuthorizations", async () => {
      expect(await roles.getProposalAuthorizations()).to.be.lengthOf(16);
    });
  });

  it("should upgrade successfully", async () => {
    expect(await roles.getVersion()).to.equal(1);

    const Contract = await ethers.getContractFactory("ICVCMRoles");
    const roles2 = (await upgrades.upgradeProxy(
      roles.address,
      Contract
    )) as ICVCMRoles;

    expect(await roles2.getVersion()).to.equal(2);
  });
});
