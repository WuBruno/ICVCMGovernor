import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
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

describe("3 ICVCMGovernor Unit Tests", async () => {
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
      governor.connect(expert),
      constitution.address,
      encodedFunctionCall,
      proposalDescription
    );

    await mine(1);
  });

  it("3.1 should create proposal", async () => {
    expect(await governor.state(proposalId), "Proposal not created").to.equal(
      1
    );
  });

  describe("3.2 Proposal Role Authorization", () => {
    describe("3.2.1 Add Member Proposal Authorization", () => {
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
      it("3.2.1.1 should prevent director from creating add member proposal", async () =>
        addMemberProposal(director1));
      it("3.2.1.2 should prevent expert from creating add member proposal", async () =>
        expect(addMemberProposal(expert)).to.revertedWith("Unauthorized"));
      it("3.2.1.3 should prevent secretariat from creating add member proposal", async () =>
        expect(addMemberProposal(secretariat)).to.revertedWith("Unauthorized"));
      it("3.2.1.4 should prevent regulator from creating add member proposal", async () =>
        expect(addMemberProposal(secretariat)).to.revertedWith("Unauthorized"));
      it("3.2.1.5 should prevent non-member from creating add member proposal", async () =>
        expect(addMemberProposal(user)).to.revertedWith("Member not found"));
    });

    describe("3.2.2 Remove Member Proposal Authorization", () => {
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
      it("3.2.2.1 should prevent director from creating remove member proposal", async () =>
        removeMemberProposal(director1));
      it("3.2.2.2 should prevent expert from creating remove member proposal", async () =>
        expect(removeMemberProposal(expert)).to.revertedWith("Unauthorized"));
      it("3.2.2.3 should prevent secretariat from creating remove member proposal", async () =>
        expect(removeMemberProposal(secretariat)).to.revertedWith(
          "Unauthorized"
        ));
      it("3.2.2.4 should prevent regulator from creating remove member proposal", async () =>
        expect(removeMemberProposal(regulator)).to.revertedWith(
          "Unauthorized"
        ));
      it("3.2.2.5 should prevent non-member from creating remove member proposal", async () =>
        expect(removeMemberProposal(user)).to.revertedWith("Member not found"));
    });

    describe("3.2.3 Add Principle Proposal Authorization", () => {
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
      it("3.2.3.1 should prevent director from creating add principle proposal", async () =>
        expect(addPrinciplesProposal(director1)).to.revertedWith(
          "Unauthorized"
        ));
      it("3.2.3.2 should allow expert to create add principle proposal", async () =>
        addPrinciplesProposal(expert));
      it("3.2.3.3 should prevent secretariat from creating add principle proposal", async () =>
        expect(addPrinciplesProposal(secretariat)).to.revertedWith(
          "Unauthorized"
        ));
      it("3.2.3.4 should prevent regulator from creating add principle proposal", async () =>
        expect(addPrinciplesProposal(regulator)).to.revertedWith(
          "Unauthorized"
        ));
      it("3.2.3.5 should prevent non-member from creating add principle proposal", async () =>
        expect(addPrinciplesProposal(user)).to.revertedWith(
          "Member not found"
        ));
    });

    describe("3.2.4 Update Principle Proposal Authorization", () => {
      const updatePrincipleProposal = async (member: SignerWithAddress) => {
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
      it("3.2.4.1 should prevent director from creating update principle proposal", async () =>
        expect(updatePrincipleProposal(director1)).to.revertedWith(
          "Unauthorized"
        ));
      it("3.2.4.2 should allow expert to create update principle proposal", async () =>
        updatePrincipleProposal(expert));
      it("3.2.4.3 should prevent secretariat from creating update principle proposal", async () =>
        expect(updatePrincipleProposal(secretariat)).to.revertedWith(
          "Unauthorized"
        ));
      it("3.2.4.4 should prevent regulator from creating update principle proposal", async () =>
        expect(updatePrincipleProposal(regulator)).to.revertedWith(
          "Unauthorized"
        ));
      it("3.2.4.5 should prevent non-member from creating update principle proposal", async () =>
        expect(updatePrincipleProposal(user)).to.revertedWith(
          "Member not found"
        ));
    });

    describe("3.2.5 Remove Principle Proposal Authorization", () => {
      const removePrincipleProposal = async (member: SignerWithAddress) => {
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
      it("3.2.5.1 should prevent director from creating remove principle proposal", async () =>
        expect(removePrincipleProposal(director1)).to.revertedWith(
          "Unauthorized"
        ));
      it("3.2.5.2 should allow expert to create remove principle proposal", async () =>
        removePrincipleProposal(expert));
      it("3.2.5.3 should prevent secretariat from creating remove principle proposal", async () =>
        expect(removePrincipleProposal(secretariat)).to.revertedWith(
          "Unauthorized"
        ));
      it("3.2.5.4 should prevent regulator from creating remove principle proposal", async () =>
        expect(removePrincipleProposal(regulator)).to.revertedWith(
          "Unauthorized"
        ));
      it("3.2.5.5 should prevent non-member from creating remove principle proposal", async () =>
        expect(removePrincipleProposal(user)).to.revertedWith(
          "Member not found"
        ));
    });

    describe("3.2.6 Add Strategy Proposal Authorization", () => {
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
      it("3.2.6.1 should prevent director from creating add strategy proposal", async () =>
        expect(addStrategyProposal(director1)).to.revertedWith("Unauthorized"));
      it("3.2.6.2 should allow secretariat to create add strategy proposal", async () =>
        addStrategyProposal(secretariat));
      it("3.2.6.3 should prevent expert from creating add strategy proposal", async () =>
        expect(addStrategyProposal(expert)).to.revertedWith("Unauthorized"));
      it("3.2.6.4 should prevent regulator from creating add strategy proposal", async () =>
        expect(addStrategyProposal(regulator)).to.revertedWith("Unauthorized"));
      it("3.2.6.5 should prevent non-member from creating add strategy proposal", async () =>
        expect(addStrategyProposal(user)).to.revertedWith("Member not found"));
    });

    describe("3.2.7 Update Strategy Proposal Authorization", () => {
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
      it("3.2.7.1 should prevent director from creating update strategy proposal", async () =>
        expect(updateStrategyProposal(director1)).to.revertedWith(
          "Unauthorized"
        ));
      it("3.2.7.2 should allow secretariat to create update strategy proposal", async () =>
        updateStrategyProposal(secretariat));
      it("3.2.7.3 should prevent expert from creating update strategy proposal", async () =>
        expect(updateStrategyProposal(expert)).to.revertedWith("Unauthorized"));
      it("3.2.7.4 should prevent regulator from creating update strategy proposal", async () =>
        expect(updateStrategyProposal(regulator)).to.revertedWith(
          "Unauthorized"
        ));
      it("3.2.7.5 should prevent non-member from creating update strategy proposal", async () =>
        expect(updateStrategyProposal(user)).to.revertedWith(
          "Member not found"
        ));
    });

    describe("3.2.8 Remove Strategy Proposal Authorization", () => {
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
      it("3.2.9.1 should prevent director from creating remove strategy proposal", async () =>
        expect(removeStrategyProposal(director1)).to.revertedWith(
          "Unauthorized"
        ));
      it("3.2.9.2 should allow secretariat to create remove strategy proposal", async () =>
        removeStrategyProposal(secretariat));
      it("3.2.9.3 should prevent expert from creating remove strategy proposal", async () =>
        expect(removeStrategyProposal(expert)).to.revertedWith("Unauthorized"));
      it("3.2.9.4 should prevent regulator from creating remove strategy proposal", async () =>
        expect(removeStrategyProposal(regulator)).to.revertedWith(
          "Unauthorized"
        ));
      it("3.2.9.5 should prevent non-member from creating remove strategy proposal", async () =>
        expect(removeStrategyProposal(user)).to.revertedWith(
          "Member not found"
        ));
    });

    describe("3.2.9 Update Quorum Proposal Authorization", () => {
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
      it("3.2.9.1 should prevent director from creating update quorum proposal", async () =>
        expect(updateQuorumProposal(director1)).to.revertedWith(
          "Unauthorized"
        ));
      it("3.2.9.2 should allow expert to create update quorum proposal", async () =>
        expect(updateQuorumProposal(expert)).to.revertedWith("Unauthorized"));
      it("3.2.9.3 should prevent secretariat from creating update quorum proposal", async () =>
        updateQuorumProposal(secretariat));
      it("3.2.9.4 should prevent regulator from creating update quorum proposal", async () =>
        expect(updateQuorumProposal(regulator)).to.revertedWith(
          "Unauthorized"
        ));
      it("3.2.9.5 should prevent non-member from creating update quorum proposal", async () =>
        expect(updateQuorumProposal(user)).to.revertedWith("Member not found"));
    });

    describe("3.2.10 Update Voting Period Proposal Authorization", () => {
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
      it("3.2.10.1 should prevent director from creating voting period proposal", async () =>
        expect(votingPeriodProposal(director1)).to.revertedWith(
          "Unauthorized"
        ));
      it("3.2.10.2 should allow expert to create voting period proposal", async () =>
        expect(votingPeriodProposal(expert)).to.revertedWith("Unauthorized"));
      it("3.2.10.3 should prevent secretariat from creating voting period proposal", async () =>
        votingPeriodProposal(secretariat));
      it("3.2.10.4 should prevent regulator from creating voting period proposal", async () =>
        expect(votingPeriodProposal(regulator)).to.revertedWith(
          "Unauthorized"
        ));
      it("3.2.10.5 should prevent non-member from creating voting period proposal", async () =>
        expect(votingPeriodProposal(user)).to.revertedWith("Member not found"));
    });

    describe("3.2.11 Upgrade Governor Proposal Authorization", () => {
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
      it("3.2.11.1 should prevent director from creating upgrade contract proposal", async () =>
        expect(upgradeContractProposal(director1)).to.revertedWith(
          "Unauthorized"
        ));
      it("3.2.11.2 should prevent expert from creating upgrade contract proposal", async () =>
        expect(upgradeContractProposal(expert)).to.revertedWith(
          "Unauthorized"
        ));
      it("3.2.11.3 should allow secretariat to create upgrade contract proposal", async () =>
        upgradeContractProposal(secretariat));
      it("3.2.11.4 should prevent regulator from creating upgrade contract proposal", async () =>
        expect(upgradeContractProposal(regulator)).to.revertedWith(
          "Unauthorized"
        ));
      it("3.2.11.5 should prevent non-member from creating upgrade contract proposal", async () =>
        expect(upgradeContractProposal(user)).to.revertedWith(
          "Member not found"
        ));
    });

    describe("3.2.12 Upgrade Roles Proposal Authorization", () => {
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
      it("3.2.12.1 should prevent director from creating upgrade contract proposal", async () =>
        expect(upgradeContractProposal(director1)).to.revertedWith(
          "Unauthorized"
        ));
      it("3.2.12.2 should prevent expert from creating upgrade contract proposal", async () =>
        expect(upgradeContractProposal(expert)).to.revertedWith(
          "Unauthorized"
        ));
      it("3.2.12.3 should allow secretariat to create upgrade contract proposal", async () =>
        upgradeContractProposal(secretariat));
      it("3.2.12.4 should prevent regulator from creating upgrade contract proposal", async () =>
        expect(upgradeContractProposal(regulator)).to.revertedWith(
          "Unauthorized"
        ));
      it("3.2.12.5 should prevent non-member from creating upgrade governor proposal", async () =>
        expect(upgradeContractProposal(user)).to.revertedWith(
          "Member not found"
        ));
    });

    describe("3.2.13 Upgrade Tokens Proposal Authorization", () => {
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
      it("3.2.13.1 should prevent director from creating upgrade contract proposal", async () =>
        expect(upgradeContractProposal(director1)).to.revertedWith(
          "Unauthorized"
        ));
      it("3.2.13.2 should prevent expert from creating upgrade contract proposal", async () =>
        expect(upgradeContractProposal(expert)).to.revertedWith(
          "Unauthorized"
        ));
      it("3.2.13.3 should allow secretariat to create upgrade contract proposal", async () =>
        upgradeContractProposal(secretariat));
      it("3.2.13.4 should prevent regulator from creating upgrade contract proposal", async () =>
        expect(upgradeContractProposal(regulator)).to.revertedWith(
          "Unauthorized"
        ));
      it("3.2.13.5 should prevent non-member from creating upgrade tokens proposal", async () =>
        expect(upgradeContractProposal(user)).to.revertedWith(
          "Member not found"
        ));
    });

    describe("3.2.14 Upgrade Constitution Proposal Authorization", () => {
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
      it("3.2.14.1 should prevent director from creating upgrade contract proposal", async () =>
        expect(upgradeContractProposal(director1)).to.revertedWith(
          "Unauthorized"
        ));
      it("3.2.14.2 should prevent expert from creating upgrade contract proposal", async () =>
        expect(upgradeContractProposal(expert)).to.revertedWith(
          "Unauthorized"
        ));
      it("3.2.14.3 should allow secretariat to create upgrade contract proposal", async () =>
        upgradeContractProposal(secretariat));
      it("3.2.14.4 should prevent regulator from creating upgrade contract proposal", async () =>
        expect(upgradeContractProposal(regulator)).to.revertedWith(
          "Unauthorized"
        ));
      it("3.2.14.5 should prevent non-member from creating upgrade constitution proposal", async () =>
        expect(upgradeContractProposal(user)).to.revertedWith(
          "Member not found"
        ));
    });
  });

  describe("3.3 Vote on Proposals", () => {
    it("3.3.1 should vote for the proposal", async () => {
      await voteProposal(governor, proposalId);
      expect(await governor.hasVoted(proposalId, director1.address)).to.equal(
        true
      );
    });

    it("3.3.2 should vote against the proposal", async () => {
      await voteProposal(governor, proposalId, 0);
      expect(await governor.hasVoted(proposalId, director1.address)).to.equal(
        true
      );
    });

    it("3.3.3 should abstain vote", async () => {
      await voteProposal(governor, proposalId, 2);
      expect(await governor.hasVoted(proposalId, director1.address)).to.equal(
        true
      );
    });

    it("3.3.4 should revert vote if it is not Director", async () => {
      expect(
        governor.castVoteWithReason(proposalId, 0, "Great example proposal")
      ).to.be.revertedWith("Function restricted to Director");
    });
  });

  describe("3.4 Proposals Outcomes", () => {
    it("3.4.1 should vote for and succeed proposal", async () => {
      await voteProposal(governor, proposalId);
      await voteProposal(governor.connect(director2), proposalId);
      // await mine(Number(process.env.VOTING_PERIOD));

      expect(
        await governor.state(proposalId),
        "Proposal not succeeded"
      ).to.equal(ProposalState.Succeeded);
    });

    it("3.4.2 should vote against proposal and defeat", async () => {
      await voteProposal(governor, proposalId, 0);
      await voteProposal(governor.connect(director2), proposalId, 0);
      // await mine(Number(process.env.VOTING_PERIOD));

      expect(
        await governor.state(proposalId),
        "Proposal not defeated"
      ).to.equal(ProposalState.Defeated);
    });
  });

  describe("3.5 Regulators Decision", () => {
    const cancellingReason = "cancelling";

    it("3.5.1 should succeed when regulator executes", async () => {
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

    it("3.5.2 should cancel when regulator cancels", async () => {
      await cancelProposal(
        governor,
        constitution.address,
        encodedFunctionCall,
        proposalDescription,
        regulator,
        cancellingReason
      );

      expect(
        await governor.state(proposalId),
        "Proposal not cancelled"
      ).to.equal(ProposalState.Canceled);
    });

    it("3.5.3 should fail execution by director", async () => {
      await voteProposal(governor, proposalId);
      await voteProposal(governor.connect(director2), proposalId);

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

    it("3.5.4 should cancel after success on votes", async () => {
      await voteProposal(governor, proposalId);
      await voteProposal(governor.connect(director2), proposalId);

      await cancelProposal(
        governor,
        constitution.address,
        encodedFunctionCall,
        proposalDescription,
        regulator,
        cancellingReason
      );

      expect(
        await governor.state(proposalId),
        "Proposal not cancelled"
      ).to.equal(ProposalState.Canceled);
    });

    it("3.5.5 should cancel and emit event with reason", async () => {
      expect(
        cancelProposal(
          governor,
          constitution.address,
          encodedFunctionCall,
          proposalDescription,
          regulator,
          cancellingReason
        )
      )
        .to.emit(governor, "CancelProposal")
        .withArgs(anyValue, cancellingReason);
    });
  });

  it("3.6 should upgrade successfully", async () => {
    expect(await governor.getVersion()).to.equal(1);

    const Contract = await ethers.getContractFactory("ICVCMGovernor");
    const impl = await upgrades.deployImplementation(Contract);

    const call = governor.interface.encodeFunctionData("upgradeTo", [
      impl.toString(),
    ]);

    await createAndPassProposal(
      governor.connect(secretariat),
      governor.address,
      call,
      "upgradeTo",
      [director1, director2],
      regulator
    );

    expect(await governor.getVersion()).to.equal(2);
  });
});
