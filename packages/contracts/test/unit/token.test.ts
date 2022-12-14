import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Roles } from "~/@types";
import { deployContracts, deployICVCMToken } from "~/services/deployment";
import { ICVCMRoles, ICVCMToken } from "~/typechain";
import { addMember } from "../helper";

describe("5 ICVCMToken Unit Tests", async () => {
  let governorToken: ICVCMToken;
  let roles: ICVCMRoles;
  let user: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async () => {
    [governorToken, , roles] = await deployContracts(undefined, false);
    [user, user2] = await ethers.getSigners();
  });

  it("5.1 should delegate vote to self upon minting", async () => {
    await addMember(roles, user.address, Roles.Director, "director1");
    expect(await governorToken.delegates(user.address)).equal(user.address);
    expect(
      await governorToken.getVotes(user.address),
      "Votes is not 0 before minting"
    ).to.equal(1);
  });

  it("5.2 should not have voting power without token", async () => {
    expect(await governorToken.getVotes(user.address)).to.equal(0);
  });

  it("5.3 should throw error upon attempting to delegate vote", async () => {
    await addMember(roles, user.address, Roles.Director, "director1");
    expect(governorToken.delegate(user2.address)).to.be.revertedWith(
      "disabled"
    );
  });

  it("5.4 should upgrade successfully", async () => {
    const token: ICVCMToken = await deployICVCMToken();
    expect(await governorToken.getVersion()).to.equal(1);

    const Contract = await ethers.getContractFactory("ICVCMToken");
    const token2 = (await upgrades.upgradeProxy(
      token.address,
      Contract
    )) as ICVCMToken;

    expect(await token2.getVersion()).to.equal(2);
  });

  it("5.5 supports EIP165 interface", async () => {
    expect(await governorToken.supportsInterface("0x01ffc9a7")).to.be.equal(
      true
    );
  });
});
