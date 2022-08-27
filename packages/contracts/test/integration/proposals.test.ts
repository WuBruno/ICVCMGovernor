import { mine } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
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
    it("1.1.1 should pass a strategy proposal", async () => {
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

    it("1.1.2 should pass a principle proposal", async () => {
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

    it("1.1.3 should pass adding director proposal", async () => {
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

    it("1.1.4 should reject proposal when adding the member to the same role", async () => {
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

    it("1.1.5 should pass remove member proposal", async () => {
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

    it("1.1.6 should pass set voting quorum proposal", async () => {
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

    it("1.1.7 should pass set voting period proposal", async () => {
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
  });
});
