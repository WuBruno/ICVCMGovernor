import { mine } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import * as dotenv from "dotenv";
import { BigNumberish } from "ethers";
import { ethers, upgrades } from "hardhat";
import { ProposalState, Roles } from "~/@types";
import { deployContracts } from "~/services/deployment";
import {
  ICVCMConstitution,
  ICVCMGovernor,
  ICVCMRoles,
  ICVCMToken,
} from "~/typechain";
import {
  addMember,
  cancelProposal,
  createAndPassProposal,
  createProposal,
  executeProposal,
  voteProposal,
} from "../helper";
dotenv.config();

describe("Governor Contract", async () => {
  let governor: ICVCMGovernor;
  let token: ICVCMToken;
  let constitution: ICVCMConstitution;
  let roles: ICVCMRoles;
  let director1: SignerWithAddress;
  let director2: SignerWithAddress;
  let regulator: SignerWithAddress;
  let secretariat: SignerWithAddress;
  let expert: SignerWithAddress;
  let user: SignerWithAddress;

  // Proposal credentials
  let proposalId: BigNumberish;
  let encodedFunctionCall: string;
  const proposalDescription = "Test Proposal";

  beforeEach(async () => {
    [director1, director2, regulator, secretariat, expert, user] =
      await ethers.getSigners();

    [token, governor, roles, constitution] = await deployContracts(
      async (_roles) => {
        await addMember(_roles, director1.address, Roles.Director, "director1");
        await addMember(_roles, director2.address, Roles.Director, "director2");
        await addMember(
          _roles,
          regulator.address,
          Roles.Regulator,
          "regulator"
        );
        await addMember(_roles, expert.address, Roles.Expert, "expert");
        await addMember(
          _roles,
          secretariat.address,
          Roles.Secretariat,
          "secretariat"
        );
      }
    );

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

  describe("Proposal Role Authorization", async () => {
    const addMemberProposal = async (member: SignerWithAddress) => {
      const encodedFunctionCall = roles.interface.encodeFunctionData(
        "addMember",
        [
          user.address,
          Roles.Director,
          ethers.utils.formatBytes32String("New user"),
        ]
      );
      return createProposal(
        governor.connect(member),
        roles.address,
        encodedFunctionCall,
        "AddMember Proposal"
      );
    };
    it("should allow director to create add member proposal", async () =>
      addMemberProposal(director1));
    it("should prevent expert from creating add member proposal", async () =>
      expect(addMemberProposal(expert)).to.revertedWith("Unauthorized"));
    it("should prevent secretariat from creating add member proposal", async () =>
      expect(addMemberProposal(secretariat)).to.revertedWith("Unauthorized"));
    it("should prevent regulator from creating add member proposal", async () =>
      expect(addMemberProposal(secretariat)).to.revertedWith("Unauthorized"));
    it("should prevent non-member from creating add member proposal", async () =>
      expect(addMemberProposal(user)).to.revertedWith("Member not found"));

    const removeMemberProposal = async (member: SignerWithAddress) => {
      const encodedFunctionCall = roles.interface.encodeFunctionData(
        "removeMember",
        [director1.address]
      );
      return createProposal(
        governor.connect(member),
        roles.address,
        encodedFunctionCall,
        "RemoveMember Proposal"
      );
    };
    it("should allow director to create remove member proposal", async () =>
      removeMemberProposal(director1));
    it("should prevent expert from creating remove member proposal", async () =>
      expect(removeMemberProposal(expert)).to.revertedWith("Unauthorized"));
    it("should prevent secretariat from creating remove member proposal", async () =>
      expect(removeMemberProposal(secretariat)).to.revertedWith(
        "Unauthorized"
      ));
    it("should prevent regulator from creating remove member proposal", async () =>
      expect(removeMemberProposal(regulator)).to.revertedWith("Unauthorized"));
    it("should prevent non-member from creating remove member proposal", async () =>
      expect(removeMemberProposal(user)).to.revertedWith("Member not found"));

    const editPrinciplesProposal = async (member: SignerWithAddress) => {
      const encodedFunctionCall = constitution.interface.encodeFunctionData(
        "setPrinciples",
        ["New principles"]
      );
      return createProposal(
        governor.connect(member),
        constitution.address,
        encodedFunctionCall,
        "EditPrinciples Proposal"
      );
    };
    it("should allow directors to create edit principle proposal", async () =>
      editPrinciplesProposal(director1));
    it("should allow expert to create edit principle proposal", async () =>
      editPrinciplesProposal(expert));
    it("should prevent secretariat from creating edit principle proposal", async () =>
      expect(editPrinciplesProposal(secretariat)).to.revertedWith(
        "Unauthorized"
      ));
    it("should prevent regulator from creating edit principle proposal", async () =>
      expect(editPrinciplesProposal(regulator)).to.revertedWith(
        "Unauthorized"
      ));
    it("should prevent non-member from creating edit principle proposal", async () =>
      expect(editPrinciplesProposal(user)).to.revertedWith("Member not found"));

    const editStrategiesProposal = async (member: SignerWithAddress) => {
      const encodedFunctionCall = constitution.interface.encodeFunctionData(
        "setStrategies",
        ["New strategies"]
      );
      return createProposal(
        governor.connect(member),
        constitution.address,
        encodedFunctionCall,
        "EditStrategies Proposal"
      );
    };
    it("should allow directors to create edit strategy proposal", async () =>
      editStrategiesProposal(director1));
    it("should allow expert to create edit strategy proposal", async () =>
      expect(editStrategiesProposal(expert)).to.revertedWith("Unauthorized"));
    it("should prevent secretariat from creating edit strategy proposal", async () =>
      editStrategiesProposal(secretariat));
    it("should prevent regulator from creating edit strategy proposal", async () =>
      expect(editStrategiesProposal(regulator)).to.revertedWith(
        "Unauthorized"
      ));
    it("should prevent non-member from creating edit strategy proposal", async () =>
      expect(editStrategiesProposal(user)).to.revertedWith("Member not found"));
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
      // await mine(Number(process.env.VOTING_PERIOD));

      expect(
        await governor.state(proposalId),
        "Proposal not succeeded"
      ).to.equal(ProposalState.Succeeded);
    });

    it("should vote against proposal and defeat", async () => {
      await voteProposal(governor, proposalId, 0);
      await voteProposal(governor.connect(director2), proposalId, 0);
      // await mine(Number(process.env.VOTING_PERIOD));

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
      // await mine(Number(process.env.VOTING_PERIOD));

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
      // await mine(Number(process.env.VOTING_PERIOD));

      expect(
        executeProposal(
          governor,
          constitution.address,
          encodedFunctionCall,
          proposalDescription,
          director1
        )
      ).to.revertedWith("Function restricted to Regulator");
    });

    it("should cancel after success on votes", async () => {
      await voteProposal(governor, proposalId);
      await voteProposal(governor.connect(director2), proposalId);
      // await mine(Number(process.env.VOTING_PERIOD));

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

  it("should upgrade successfully", async () => {
    expect(await governor.getVersion()).to.equal(1);

    const Contract = await ethers.getContractFactory("ICVCMGovernor");
    const impl = await upgrades.deployImplementation(Contract);

    const call = governor.interface.encodeFunctionData("upgradeTo", [
      impl.toString(),
    ]);

    await createAndPassProposal(
      governor,
      governor.address,
      call,
      "upgradeTo",
      [director1, director2],
      regulator
    );

    expect(await governor.getVersion()).to.equal(2);
  });
});
