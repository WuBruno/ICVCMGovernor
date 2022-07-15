import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Roles } from "~/@types";
import { deployContracts } from "~/services/deployment";
import { ICVCMRoles, ICVCMToken } from "~/typechain";
import { addMember } from "../helper";

describe("Token Contract", async () => {
  let governorToken: ICVCMToken;
  let roles: ICVCMRoles;
  let user: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async () => {
    [governorToken, , roles] = await deployContracts();
    [user, user2] = await ethers.getSigners();
  });

  it("should delegate vote to self upon minting", async () => {
    await addMember(roles, user.address, Roles.Director, "director1");
    expect(await governorToken.delegates(user.address)).equal(user.address);
    expect(
      await governorToken.getVotes(user.address),
      "Votes is not 0 before minting"
    ).to.equal(1);
  });

  it("should not have voting power without token", async () => {
    expect(await governorToken.getVotes(user.address)).to.equal(0);
  });

  it("should throw error upon attempting to delegate vote", async () => {
    await addMember(roles, user.address, Roles.Director, "director1");
    expect(governorToken.delegate(user2.address)).to.be.revertedWith(
      "disabled"
    );
  });
});
