import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumberish } from "ethers";
import { ethers } from "hardhat";
import { Roles } from "~/@types";
import { deployContracts } from "~/services/deployment";
import { ICVCMGovernor, ICVCMRoles, ICVCMToken } from "~/typechain";
import { moveBlocks } from "~/utils";
import { createProposal, voteProposal } from "../helper";

describe("Governor Contract", async () => {
  let governor: ICVCMGovernor;
  let governorToken: ICVCMToken;
  let roles: ICVCMRoles;
  let owner: SignerWithAddress;
  let user2: SignerWithAddress;
  let proposalId: BigNumberish;

  beforeEach(async () => {
    [governorToken, governor, roles] = await deployContracts();

    [owner, user2] = await ethers.getSigners();

    await roles.addMember(
      owner.address,
      Roles.Director,
      ethers.utils.formatBytes32String("director1")
    );
    await roles.addMember(
      user2.address,
      Roles.Director,
      ethers.utils.formatBytes32String("director2")
    );

    proposalId = await createProposal(governorToken, governor, owner.address);
    await moveBlocks(1);
  });

  it("should create proposal", async () => {
    expect(await governor.state(proposalId), "Proposal not created").to.equal(
      1
    );
  });

  describe("Vote on Proposals", () => {
    it("should vote for the proposal", async () => {
      await voteProposal(governor, proposalId);
      expect(await governor.hasVoted(proposalId, owner.address)).to.equal(true);
    });

    it("should vote against the proposal", async () => {
      await voteProposal(governor, proposalId, 0);
      expect(await governor.hasVoted(proposalId, owner.address)).to.equal(true);
    });
  });

  describe("Proposals Outcomes", () => {
    it("should vote for and succeed proposal", async () => {
      await voteProposal(governor, proposalId);
      await voteProposal(governor.connect(user2), proposalId);

      await moveBlocks(300);

      expect(
        await governor.state(proposalId),
        "Proposal not succeeded"
      ).to.equal(4);
    });

    it("should vote against proposal and defeat", async () => {
      await voteProposal(governor, proposalId, 0);
      await voteProposal(governor.connect(user2), proposalId, 0);

      await moveBlocks(300);

      expect(
        await governor.state(proposalId),
        "Proposal not defeated"
      ).to.equal(3);
    });
  });
});
