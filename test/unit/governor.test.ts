import { mine } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumberish } from "ethers";
import { ethers } from "hardhat";
import { ProposalState, Roles } from "~/@types";
import { deployContracts } from "~/services/deployment";
import { ICVCMConstitution, ICVCMGovernor } from "~/typechain";
import {
  addMember,
  cancelProposal,
  createProposal,
  executeProposal,
  voteProposal,
} from "../helper";

describe("Governor Contract", async () => {
  let governor: ICVCMGovernor;
  let constitution: ICVCMConstitution;
  let director1: SignerWithAddress;
  let director2: SignerWithAddress;
  let regulator: SignerWithAddress;

  // Proposal credentials
  let proposalId: BigNumberish;
  let encodedFunctionCall: string;
  const proposalDescription = "Test Proposal";

  beforeEach(async () => {
    [director1, director2, regulator] = await ethers.getSigners();

    [, governor, , constitution] = await deployContracts(async (_roles) => {
      await addMember(_roles, director1.address, Roles.Director, "director1");
      await addMember(_roles, director2.address, Roles.Director, "director2");
      await addMember(_roles, regulator.address, Roles.Regulator, "regulator");
    });

    encodedFunctionCall = constitution.interface.encodeFunctionData(
      "setPrinciples",
      ["hello world"]
    );
    proposalId = await createProposal(
      governor,
      constitution.address,
      encodedFunctionCall,
      proposalDescription
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
      expect(await governor.hasVoted(proposalId, director1.address)).to.equal(
        true
      );
    });

    it("should vote against the proposal", async () => {
      await voteProposal(governor, proposalId, 0);
      expect(await governor.hasVoted(proposalId, director1.address)).to.equal(
        true
      );
    });
  });

  describe("Proposals Outcomes", () => {
    it("should vote for and succeed proposal", async () => {
      await voteProposal(governor, proposalId);
      await voteProposal(governor.connect(director2), proposalId);

      await mine(300);

      expect(
        await governor.state(proposalId),
        "Proposal not succeeded"
      ).to.equal(ProposalState.Succeeded);
    });

    it("should vote against proposal and defeat", async () => {
      await voteProposal(governor, proposalId, 0);
      await voteProposal(governor.connect(director2), proposalId, 0);

      await mine(300);

      expect(
        await governor.state(proposalId),
        "Proposal not defeated"
      ).to.equal(ProposalState.Defeated);
    });
  });

  describe("Regulators Decision", () => {
    it("should succeed when regulator executes", async () => {
      await voteProposal(governor, proposalId);
      await voteProposal(governor.connect(director2), proposalId);
      await mine(300);

      await executeProposal(
        governor,
        constitution.address,
        encodedFunctionCall,
        proposalDescription,
        regulator
      );

      expect(
        await governor.state(proposalId),
        "Proposal not executed"
      ).to.equal(ProposalState.Executed);
    });

    it("should cancel when regulator cancels", async () => {
      await cancelProposal(
        governor,
        constitution.address,
        encodedFunctionCall,
        proposalDescription,
        regulator
      );

      expect(
        await governor.state(proposalId),
        "Proposal not cancelled"
      ).to.equal(ProposalState.Canceled);
    });

    it("should fail execution by director", async () => {
      await voteProposal(governor, proposalId);
      await voteProposal(governor.connect(director2), proposalId);
      await mine(300);

      expect(
        executeProposal(
          governor,
          constitution.address,
          encodedFunctionCall,
          proposalDescription,
          director1
        )
      ).to.revertedWith("Execute restricted to Regulator");
    });

    it("should cancel after success on votes", async () => {
      await voteProposal(governor, proposalId);
      await voteProposal(governor.connect(director2), proposalId);
      await mine(300);

      await cancelProposal(
        governor,
        constitution.address,
        encodedFunctionCall,
        proposalDescription,
        regulator
      );

      expect(
        await governor.state(proposalId),
        "Proposal not cancelled"
      ).to.equal(ProposalState.Canceled);
    });
  });
});
