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
      "addPrinciple",
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

  describe("Proposal Role Authorization", () => {
    describe("Add Member Proposal Authorization", () => {
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
    });

    describe("Remove Member Proposal Authorization", () => {
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
        expect(removeMemberProposal(regulator)).to.revertedWith(
          "Unauthorized"
        ));
      it("should prevent non-member from creating remove member proposal", async () =>
        expect(removeMemberProposal(user)).to.revertedWith("Member not found"));
    });

    describe("Add Principle Proposal Authorization", () => {
      const addPrinciplesProposal = async (member: SignerWithAddress) => {
        const encodedFunctionCall = constitution.interface.encodeFunctionData(
          "addPrinciple",
          ["New principles"]
        );
        return createProposal(
          governor.connect(member),
          constitution.address,
          encodedFunctionCall,
          "AddPrinciples Proposal"
        );
      };
      it("should allow directors to create add principle proposal", async () =>
        addPrinciplesProposal(director1));
      it("should allow expert to create add principle proposal", async () =>
        addPrinciplesProposal(expert));
      it("should prevent secretariat from creating add principle proposal", async () =>
        expect(addPrinciplesProposal(secretariat)).to.revertedWith(
          "Unauthorized"
        ));
      it("should prevent regulator from creating add principle proposal", async () =>
        expect(addPrinciplesProposal(regulator)).to.revertedWith(
          "Unauthorized"
        ));
      it("should prevent non-member from creating add principle proposal", async () =>
        expect(addPrinciplesProposal(user)).to.revertedWith(
          "Member not found"
        ));
    });

    describe("Update Principle Proposal Authorization", () => {
      const UpdatePrincipleProposal = async (member: SignerWithAddress) => {
        const encodedFunctionCall = constitution.interface.encodeFunctionData(
          "updatePrinciple",
          [1, "New principles"]
        );
        return createProposal(
          governor.connect(member),
          constitution.address,
          encodedFunctionCall,
          "UpdatePrinciple Proposal"
        );
      };
      it("should allow directors to create update principle proposal", async () =>
        UpdatePrincipleProposal(director1));
      it("should allow expert to create update principle proposal", async () =>
        UpdatePrincipleProposal(expert));
      it("should prevent secretariat from creating update principle proposal", async () =>
        expect(UpdatePrincipleProposal(secretariat)).to.revertedWith(
          "Unauthorized"
        ));
      it("should prevent regulator from creating update principle proposal", async () =>
        expect(UpdatePrincipleProposal(regulator)).to.revertedWith(
          "Unauthorized"
        ));
      it("should prevent non-member from creating update principle proposal", async () =>
        expect(UpdatePrincipleProposal(user)).to.revertedWith(
          "Member not found"
        ));
    });

    describe("Remove Principle Proposal Authorization", () => {
      const RemovePrincipleProposal = async (member: SignerWithAddress) => {
        const encodedFunctionCall = constitution.interface.encodeFunctionData(
          "removePrinciple",
          [1]
        );
        return createProposal(
          governor.connect(member),
          constitution.address,
          encodedFunctionCall,
          "RemovePrinciple Proposal"
        );
      };
      it("should allow directors to create remove principle proposal", async () =>
        RemovePrincipleProposal(director1));
      it("should allow expert to create remove principle proposal", async () =>
        RemovePrincipleProposal(expert));
      it("should prevent secretariat from creating remove principle proposal", async () =>
        expect(RemovePrincipleProposal(secretariat)).to.revertedWith(
          "Unauthorized"
        ));
      it("should prevent regulator from creating remove principle proposal", async () =>
        expect(RemovePrincipleProposal(regulator)).to.revertedWith(
          "Unauthorized"
        ));
      it("should prevent non-member from creating remove principle proposal", async () =>
        expect(RemovePrincipleProposal(user)).to.revertedWith(
          "Member not found"
        ));
    });

    describe("Add Strategy Proposal Authorization", () => {
      const addStrategyProposal = async (member: SignerWithAddress) => {
        const encodedFunctionCall = constitution.interface.encodeFunctionData(
          "addStrategy",
          ["New strategies"]
        );
        return createProposal(
          governor.connect(member),
          constitution.address,
          encodedFunctionCall,
          "AddStrategies Proposal"
        );
      };
      it("should allow directors to create add strategy proposal", async () =>
        addStrategyProposal(director1));
      it("should allow secretariat to create add strategy proposal", async () =>
        addStrategyProposal(secretariat));
      it("should prevent expert from creating add strategy proposal", async () =>
        expect(addStrategyProposal(expert)).to.revertedWith("Unauthorized"));
      it("should prevent regulator from creating add strategy proposal", async () =>
        expect(addStrategyProposal(regulator)).to.revertedWith("Unauthorized"));
      it("should prevent non-member from creating add strategy proposal", async () =>
        expect(addStrategyProposal(user)).to.revertedWith("Member not found"));
    });

    describe("Update Strategy Proposal Authorization", () => {
      const updateStrategyProposal = async (member: SignerWithAddress) => {
        const encodedFunctionCall = constitution.interface.encodeFunctionData(
          "updateStrategy",
          [1, "New strategies"]
        );
        return createProposal(
          governor.connect(member),
          constitution.address,
          encodedFunctionCall,
          "UpdateStrategy Proposal"
        );
      };
      it("should allow directors to create update strategy proposal", async () =>
        updateStrategyProposal(director1));
      it("should allow secretariat to create update strategy proposal", async () =>
        updateStrategyProposal(secretariat));
      it("should prevent expert from creating update strategy proposal", async () =>
        expect(updateStrategyProposal(expert)).to.revertedWith("Unauthorized"));
      it("should prevent regulator from creating update strategy proposal", async () =>
        expect(updateStrategyProposal(regulator)).to.revertedWith(
          "Unauthorized"
        ));
      it("should prevent non-member from creating update strategy proposal", async () =>
        expect(updateStrategyProposal(user)).to.revertedWith(
          "Member not found"
        ));
    });

    describe("Remove Strategy Proposal Authorization", () => {
      const removeStrategyProposal = async (member: SignerWithAddress) => {
        const encodedFunctionCall = constitution.interface.encodeFunctionData(
          "removeStrategy",
          [1]
        );
        return createProposal(
          governor.connect(member),
          constitution.address,
          encodedFunctionCall,
          "RemoveStrategy Proposal"
        );
      };
      it("should allow directors to create remove strategy proposal", async () =>
        removeStrategyProposal(director1));
      it("should allow secretariat to create remove strategy proposal", async () =>
        removeStrategyProposal(secretariat));
      it("should prevent expert from creating remove strategy proposal", async () =>
        expect(removeStrategyProposal(expert)).to.revertedWith("Unauthorized"));
      it("should prevent regulator from creating remove strategy proposal", async () =>
        expect(removeStrategyProposal(regulator)).to.revertedWith(
          "Unauthorized"
        ));
      it("should prevent non-member from creating remove strategy proposal", async () =>
        expect(removeStrategyProposal(user)).to.revertedWith(
          "Member not found"
        ));
    });

    describe("Update Quorum Proposal Authorization", () => {
      const updateQuorumProposal = async (member: SignerWithAddress) => {
        const encodedFunctionCall = governor.interface.encodeFunctionData(
          "updateQuorumNumerator",
          [10]
        );
        return createProposal(
          governor.connect(member),
          governor.address,
          encodedFunctionCall,
          "UpdateQuorum Proposal"
        );
      };
      it("should allow directors to create update quorum proposal", async () =>
        updateQuorumProposal(director1));
      it("should allow expert to create update quorum proposal", async () =>
        expect(updateQuorumProposal(expert)).to.revertedWith("Unauthorized"));
      it("should prevent secretariat from creating update quorum proposal", async () =>
        updateQuorumProposal(secretariat));
      it("should prevent regulator from creating update quorum proposal", async () =>
        expect(updateQuorumProposal(regulator)).to.revertedWith(
          "Unauthorized"
        ));
      it("should prevent non-member from creating update quorum proposal", async () =>
        expect(updateQuorumProposal(user)).to.revertedWith("Member not found"));
    });

    describe("Update Voting Period Proposal Authorization", () => {
      const votingPeriodProposal = async (member: SignerWithAddress) => {
        const encodedFunctionCall = governor.interface.encodeFunctionData(
          "setVotingPeriod",
          [10]
        );
        return createProposal(
          governor.connect(member),
          governor.address,
          encodedFunctionCall,
          "Update Voting Period Proposal"
        );
      };
      it("should allow directors to create voting period proposal", async () =>
        votingPeriodProposal(director1));
      it("should allow expert to create voting period proposal", async () =>
        expect(votingPeriodProposal(expert)).to.revertedWith("Unauthorized"));
      it("should prevent secretariat from creating voting period proposal", async () =>
        votingPeriodProposal(secretariat));
      it("should prevent regulator from creating voting period proposal", async () =>
        expect(votingPeriodProposal(regulator)).to.revertedWith(
          "Unauthorized"
        ));
      it("should prevent non-member from creating voting period proposal", async () =>
        expect(votingPeriodProposal(user)).to.revertedWith("Member not found"));
    });

    describe("Upgrade Governor Proposal Authorization", () => {
      const upgradeContractProposal = async (member: SignerWithAddress) => {
        const encodedFunctionCall = governor.interface.encodeFunctionData(
          "upgradeTo",
          ["0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f"]
        );
        return createProposal(
          governor.connect(member),
          governor.address,
          encodedFunctionCall,
          "UpgradeContract Proposal"
        );
      };
      it("should allow directors to create upgrade contract proposal", async () =>
        upgradeContractProposal(director1));
      it("should allow expert to create upgrade contract proposal", async () =>
        expect(upgradeContractProposal(expert)).to.revertedWith(
          "Unauthorized"
        ));
      it("should prevent secretariat from creating upgrade contract proposal", async () =>
        upgradeContractProposal(secretariat));
      it("should prevent regulator from creating upgrade contract proposal", async () =>
        expect(upgradeContractProposal(regulator)).to.revertedWith(
          "Unauthorized"
        ));
      it("should prevent non-member from creating upgrade contract proposal", async () =>
        expect(upgradeContractProposal(user)).to.revertedWith(
          "Member not found"
        ));
    });

    describe("Upgrade Roles Proposal Authorization", () => {
      const upgradeContractProposal = async (member: SignerWithAddress) => {
        const encodedFunctionCall = roles.interface.encodeFunctionData(
          "upgradeTo",
          ["0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f"]
        );
        return createProposal(
          governor.connect(member),
          roles.address,
          encodedFunctionCall,
          "UpgradeGovernor Proposal"
        );
      };
      it("should allow directors to create upgrade governor proposal", async () =>
        upgradeContractProposal(director1));
      it("should allow expert to create upgrade governor proposal", async () =>
        expect(upgradeContractProposal(expert)).to.revertedWith(
          "Unauthorized"
        ));
      it("should prevent secretariat from creating upgrade governor proposal", async () =>
        upgradeContractProposal(secretariat));
      it("should prevent regulator from creating upgrade governor proposal", async () =>
        expect(upgradeContractProposal(regulator)).to.revertedWith(
          "Unauthorized"
        ));
      it("should prevent non-member from creating upgrade governor proposal", async () =>
        expect(upgradeContractProposal(user)).to.revertedWith(
          "Member not found"
        ));
    });

    describe("Upgrade Tokens Proposal Authorization", () => {
      const upgradeContractProposal = async (member: SignerWithAddress) => {
        const encodedFunctionCall = token.interface.encodeFunctionData(
          "upgradeTo",
          ["0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f"]
        );
        return createProposal(
          governor.connect(member),
          token.address,
          encodedFunctionCall,
          "Upgrade Tokens Proposal"
        );
      };
      it("should allow directors to create upgrade tokens proposal", async () =>
        upgradeContractProposal(director1));
      it("should allow expert to create upgrade tokens proposal", async () =>
        expect(upgradeContractProposal(expert)).to.revertedWith(
          "Unauthorized"
        ));
      it("should prevent secretariat from creating upgrade tokens proposal", async () =>
        upgradeContractProposal(secretariat));
      it("should prevent regulator from creating upgrade tokens proposal", async () =>
        expect(upgradeContractProposal(regulator)).to.revertedWith(
          "Unauthorized"
        ));
      it("should prevent non-member from creating upgrade tokens proposal", async () =>
        expect(upgradeContractProposal(user)).to.revertedWith(
          "Member not found"
        ));
    });

    describe("Upgrade Constitution Proposal Authorization", () => {
      const upgradeContractProposal = async (member: SignerWithAddress) => {
        const encodedFunctionCall = constitution.interface.encodeFunctionData(
          "upgradeTo",
          ["0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f"]
        );
        return createProposal(
          governor.connect(member),
          constitution.address,
          encodedFunctionCall,
          "Upgrade Constitution Proposal"
        );
      };
      it("should allow directors to create upgrade constitution proposal", async () =>
        upgradeContractProposal(director1));
      it("should allow expert to create upgrade constitution proposal", async () =>
        expect(upgradeContractProposal(expert)).to.revertedWith(
          "Unauthorized"
        ));
      it("should prevent secretariat from creating upgrade constitution proposal", async () =>
        upgradeContractProposal(secretariat));
      it("should prevent regulator from creating upgrade constitution proposal", async () =>
        expect(upgradeContractProposal(regulator)).to.revertedWith(
          "Unauthorized"
        ));
      it("should prevent non-member from creating upgrade constitution proposal", async () =>
        expect(upgradeContractProposal(user)).to.revertedWith(
          "Member not found"
        ));
    });
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
