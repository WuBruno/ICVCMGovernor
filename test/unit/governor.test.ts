import { mine } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumberish } from "ethers";
import { ethers } from "hardhat";
import { Roles } from "~/@types";
import { deployContracts } from "~/services/deployment";
import { ICVCMGovernor, ICVCMToken } from "~/typechain";
import { addMember, createProposal, voteProposal } from "../helper";

describe("Governor Contract", async () => {
  let governor: ICVCMGovernor;
  let governorToken: ICVCMToken;
  let users: SignerWithAddress[];
  let proposalId: BigNumberish;

  beforeEach(async () => {
    users = await ethers.getSigners();

    [governorToken, governor] = await deployContracts(async (_roles) => {
      await addMember(_roles, users[0].address, Roles.Director, "director1");
      await addMember(_roles, users[1].address, Roles.Director, "director2");
    });

    proposalId = await createProposal(
      governorToken,
      governor,
      users[0].address
    );
    await mine(1);
  });

  it("should create proposal", async () => {
    expect(await governor.state(proposalId), "Proposal not created").to.equal(
      1
    );
  });

  describe("Vote on Proposals", () => {
    it("should vote for the proposal", async () => {
      await voteProposal(governor, proposalId);
      expect(await governor.hasVoted(proposalId, users[0].address)).to.equal(
        true
      );
    });

    it("should vote against the proposal", async () => {
      await voteProposal(governor, proposalId, 0);
      expect(await governor.hasVoted(proposalId, users[0].address)).to.equal(
        true
      );
    });
  });

  describe("Proposals Outcomes", () => {
    it("should vote for and succeed proposal", async () => {
      await voteProposal(governor, proposalId);
      await voteProposal(governor.connect(users[1]), proposalId);

      await mine(300);

      expect(
        await governor.state(proposalId),
        "Proposal not succeeded"
      ).to.equal(4);
    });

    it("should vote against proposal and defeat", async () => {
      await voteProposal(governor, proposalId, 0);
      await voteProposal(governor.connect(users[1]), proposalId, 0);

      await mine(300);

      expect(
        await governor.state(proposalId),
        "Proposal not defeated"
      ).to.equal(3);
    });
  });
});
