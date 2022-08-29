import { mine } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Roles } from "~/@types";
import { deployContracts } from "~/services/deployment";
import {
  ICVCMConstitution,
  ICVCMGovernor,
  ICVCMRoles,
  ICVCMToken,
} from "~/typechain";
import { addMember, createAndPassProposal } from "../helper";

describe("1 Proposal Integration Tests", async () => {
  let governor: ICVCMGovernor;
  let token: ICVCMToken;
  let constitution: ICVCMConstitution;
  let roles: ICVCMRoles;
  let owner: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let regulator: SignerWithAddress;
  let expert: SignerWithAddress;
  let secretariat: SignerWithAddress;

  beforeEach(async () => {
    [owner, user2, user3, regulator, expert, secretariat] =
      await ethers.getSigners();

    [token, governor, roles, constitution] = await deployContracts(
      async (_roles) => {
        await addMember(_roles, owner.address, Roles.Director, "director1");
        await addMember(_roles, user2.address, Roles.Director, "director2");
        await addMember(
          _roles,
          regulator.address,
          Roles.Regulator,
          "regulator1"
        );
        await addMember(_roles, expert.address, Roles.Expert, "expert1");
        await addMember(
          _roles,
          secretariat.address,
          Roles.Secretariat,
          "secretariat"
        );
      }
    );

    await mine(1);
  });

  describe("1.1 Passing Types of Proposals", () => {
    it("1.1.1 should pass an add strategy proposal", async () => {
      const newStrategy = "The best strategy";
      const setProposalCall = constitution.interface.encodeFunctionData(
        "addStrategy",
        [newStrategy]
      );

      const description = "New strategy proposal";

      await createAndPassProposal(
        governor.connect(secretariat),
        constitution.address,
        setProposalCall,
        description,
        [owner, user2],
        regulator
      );

      expect(await constitution.getStrategy(1)).to.equal(newStrategy);
    });

    it("1.1.2 should pass an update strategy proposal", async () => {
      const newStrategy = "The best strategy";
      const setProposalCall = constitution.interface.encodeFunctionData(
        "addStrategy",
        [newStrategy]
      );

      const description = "New strategy proposal";

      await createAndPassProposal(
        governor.connect(secretariat),
        constitution.address,
        setProposalCall,
        description,
        [owner, user2],
        regulator
      );

      expect(await constitution.getStrategy(1)).to.equal(newStrategy);

      const updateStrategy = "Updated strategy";
      const setProposalCall2 = constitution.interface.encodeFunctionData(
        "updateStrategy",
        [1, updateStrategy]
      );

      await createAndPassProposal(
        governor.connect(secretariat),
        constitution.address,
        setProposalCall2,
        description,
        [owner, user2],
        regulator
      );

      expect(await constitution.getStrategy(1)).to.equal(updateStrategy);
    });

    it("1.1.3 should pass a remove strategy proposal", async () => {
      const newStrategy = "The best strategy";
      const setProposalCall = constitution.interface.encodeFunctionData(
        "addStrategy",
        [newStrategy]
      );

      const description = "New strategy proposal";

      await createAndPassProposal(
        governor.connect(secretariat),
        constitution.address,
        setProposalCall,
        description,
        [owner, user2],
        regulator
      );

      expect(await constitution.getStrategy(1)).to.equal(newStrategy);

      const removeStrategyCall = constitution.interface.encodeFunctionData(
        "removeStrategy",
        [1]
      );

      await createAndPassProposal(
        governor.connect(secretariat),
        constitution.address,
        removeStrategyCall,
        description,
        [owner, user2],
        regulator
      );

      expect(constitution.getStrategy(1)).to.be.revertedWith(
        "Invalid Strategy Id"
      );
    });

    it("1.1.4 should pass an add principle proposal", async () => {
      const newPrinciple = "The best principle 2";
      const setPrincipleCall = constitution.interface.encodeFunctionData(
        "addPrinciple",
        [newPrinciple]
      );

      const description = "New principle proposal";

      await createAndPassProposal(
        governor.connect(expert),
        constitution.address,
        setPrincipleCall,
        description,
        [owner, user2],
        regulator
      );

      expect(await constitution.getPrinciple(1)).to.equal(newPrinciple);
    });

    it("1.1.5 should pass an update principle proposal", async () => {
      const newPrinciple = "The best principle 2";
      const setPrincipleCall = constitution.interface.encodeFunctionData(
        "addPrinciple",
        [newPrinciple]
      );

      const description = "New principle proposal";

      await createAndPassProposal(
        governor.connect(expert),
        constitution.address,
        setPrincipleCall,
        description,
        [owner, user2],
        regulator
      );

      expect(await constitution.getPrinciple(1)).to.equal(newPrinciple);

      const updatePrinciple = "Update Principle";
      const setProposalCall2 = constitution.interface.encodeFunctionData(
        "updatePrinciple",
        [1, updatePrinciple]
      );

      await createAndPassProposal(
        governor.connect(expert),
        constitution.address,
        setProposalCall2,
        description,
        [owner, user2],
        regulator
      );

      expect(await constitution.getPrinciple(1)).to.equal(updatePrinciple);
    });

    it("1.1.6 should pass a remove principle proposal", async () => {
      const newPrinciple = "The best principle 2";
      const setPrincipleCall = constitution.interface.encodeFunctionData(
        "addPrinciple",
        [newPrinciple]
      );

      const description = "New principle proposal";

      await createAndPassProposal(
        governor.connect(expert),
        constitution.address,
        setPrincipleCall,
        description,
        [owner, user2],
        regulator
      );

      expect(await constitution.getPrinciple(1)).to.equal(newPrinciple);

      const removePrincipleCall = constitution.interface.encodeFunctionData(
        "removePrinciple",
        [1]
      );

      await createAndPassProposal(
        governor.connect(expert),
        constitution.address,
        removePrincipleCall,
        description,
        [owner, user2],
        regulator
      );

      expect(constitution.getPrinciple(1)).to.be.revertedWith(
        "Invalid Strategy Id"
      );
    });

    it("1.1.7 should pass adding director proposal", async () => {
      const description = "Adding new director";
      const name = ethers.utils.formatBytes32String("Director");
      const addMemberCall = roles.interface.encodeFunctionData("addMember", [
        user3.address,
        Roles.Director,
        name,
      ]);

      await createAndPassProposal(
        governor.connect(owner),
        roles.address,
        addMemberCall,
        description,
        [owner, user2],
        regulator
      );

      expect(
        (await roles.getMember(user3.address)).name,
        "Should find the name of the director once passed"
      ).to.equal(name);
      expect(
        await token.getVotes(user3.address),
        "Voting power should be 1 after adding proposal passes"
      ).to.equal(1);
    });

    it("1.1.8 should reject proposal when adding the member to the same role", async () => {
      const description = "Adding new director";
      const name = ethers.utils.formatBytes32String("Director");
      const addMemberCall = roles.interface.encodeFunctionData("addMember", [
        owner.address,
        Roles.Director,
        name,
      ]);

      expect(
        createAndPassProposal(
          governor.connect(owner),
          roles.address,
          addMemberCall,
          description,
          [owner, user2],
          regulator
        )
      ).to.revertedWith("Member already exists");
    });

    it("1.1.9 should pass remove member proposal", async () => {
      const description = "Remove director";
      const removeMemberCall = roles.interface.encodeFunctionData(
        "removeMember",
        [user2.address]
      );

      await createAndPassProposal(
        governor.connect(owner),
        roles.address,
        removeMemberCall,
        description,
        [owner, user2],
        regulator
      );

      expect(
        roles.getMember(user2.address),
        "Should not find the member once removed"
      ).to.revertedWith("Member not found");
      expect(
        await token.getVotes(user2.address),
        "Member's voting power should be 0 once removed"
      ).to.equal(0);
    });

    it("1.1.10 should pass set voting quorum proposal", async () => {
      const description = "Change Quorum";
      const newQuorum = 66;
      const updateQuorumCall = governor.interface.encodeFunctionData(
        "updateQuorumNumerator",
        [newQuorum]
      );

      await createAndPassProposal(
        governor.connect(secretariat),
        governor.address,
        updateQuorumCall,
        description,
        [owner, user2],
        regulator
      );

      expect(
        await governor["quorumNumerator()"](),
        "Voting quorum should have updated"
      ).to.equal(newQuorum);
    });

    it("1.1.11 should pass set voting period proposal", async () => {
      const description = "Change Voting Period";
      const newVotingPeriod = 100;
      const updateQuorumCall = governor.interface.encodeFunctionData(
        "setVotingPeriod",
        [newVotingPeriod]
      );

      await createAndPassProposal(
        governor.connect(secretariat),
        governor.address,
        updateQuorumCall,
        description,
        [owner, user2],
        regulator
      );

      expect(
        await governor.votingPeriod(),
        "Voting period should have updated"
      ).to.equal(newVotingPeriod);
    });

    it("1.1.12 should pass add proposal authorization proposal", async () => {
      const description = "Add Proposal Authorization Proposal";
      const functionCall = roles.interface.encodeFunctionData(
        "addProposalAuthorization",
        [
          roles.address,
          roles.interface.getSighash("addMember"),
          Roles.Secretariat,
        ]
      );

      await createAndPassProposal(
        governor.connect(secretariat),
        roles.address,
        functionCall,
        description,
        [owner, user2],
        regulator
      );

      expect(
        await roles.hasProposalAuthorization(
          roles.address,
          roles.interface.getSighash("addMember"),
          Roles.Secretariat
        )
      ).to.equal(true);
    });

    it("1.1.13 should pass remove proposal authorization proposal", async () => {
      const description = "Add Proposal Authorization Proposal";
      const functionCall = roles.interface.encodeFunctionData(
        "removeProposalAuthorization",
        [roles.address, roles.interface.getSighash("addMember"), Roles.Director]
      );

      await createAndPassProposal(
        governor.connect(secretariat),
        roles.address,
        functionCall,
        description,
        [owner, user2],
        regulator
      );

      expect(
        await roles.hasProposalAuthorization(
          roles.address,
          roles.interface.getSighash("addMember"),
          Roles.Director
        )
      ).to.equal(false);
    });

    it("1.1.14 should pass upgrade contract proposal", async () => {
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
        [owner, user2],
        regulator
      );

      expect(await governor.getVersion()).to.equal(2);
    });
  });
});
