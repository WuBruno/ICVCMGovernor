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
import { mine } from "@nomicfoundation/hardhat-network-helpers";

describe("Proposal Integration Tests", async () => {
  let governor: ICVCMGovernor;
  let token: ICVCMToken;
  let constitution: ICVCMConstitution;
  let roles: ICVCMRoles;
  let owner: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

  beforeEach(async () => {
    [owner, user2, user3] = await ethers.getSigners();

    [token, governor, roles, constitution] = await deployContracts(
      async (_roles) => {
        await addMember(_roles, owner.address, Roles.Director, "director1");
        await addMember(_roles, user2.address, Roles.Director, "director2");
      }
    );

    await mine(1);
  });

  describe("Passing Types of Proposals", () => {
    it("should pass a strategy proposal", async () => {
      const newStrategy = "The best strategy";
      const setProposalCall = constitution.interface.encodeFunctionData(
        "setStrategies",
        [newStrategy]
      );
      const description = "New strategy proposal";

      await createAndPassProposal(
        token,
        governor,
        constitution.address,
        setProposalCall,
        description,
        [owner, user2]
      );

      expect(await constitution.getStrategies()).equal(newStrategy);
    });

    it("should pass a principle proposal", async () => {
      const newPrinciple = "The best principle";
      const setPrincipleCall = constitution.interface.encodeFunctionData(
        "setPrinciples",
        [newPrinciple]
      );
      const description = "New principle proposal";

      await createAndPassProposal(
        token,
        governor,
        constitution.address,
        setPrincipleCall,
        description,
        [owner, user2]
      );

      expect(await constitution.getPrinciples()).equal(newPrinciple);
    });

    it("should pass adding member proposal", async () => {
      const description = "Adding new member";
      const name = ethers.utils.formatBytes32String("Director");
      const addMemberCall = roles.interface.encodeFunctionData("addMember", [
        user3.address,
        Roles.Director,
        name,
      ]);

      await createAndPassProposal(
        token,
        governor,
        roles.address,
        addMemberCall,
        description,
        [owner, user2]
      );

      expect((await roles.getMember(user3.address)).name).to.equal(name);
    });
  });
});
