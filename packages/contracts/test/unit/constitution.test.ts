import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { deployICVCMConstitution } from "~/services/deployment";
import { ICVCMConstitution } from "~/typechain";

describe("2 Constitution Unit Tests", async () => {
  let constitution: ICVCMConstitution;

  beforeEach(async () => {
    constitution = await deployICVCMConstitution();
  });

  describe("2.1 Constitution Principles", async () => {
    const principle = "principle1";
    beforeEach(async () => {
      await constitution.addPrinciple(principle);
    });

    it("2.1.1 should add new principle", async () => {
      expect(await constitution.getPrinciple(1)).to.equal(principle);
    });

    it("2.1.2 should add 2 new principle", async () => {
      await constitution.addPrinciple("new one 2");
      await constitution.addPrinciple("new one");

      expect(await constitution.getPrinciples()).to.have.lengthOf(3);
    });

    it("2.1.3 should edit principle", async () => {
      const newPrinciple = "principle2";
      await constitution.updatePrinciple(1, newPrinciple);
      expect(await constitution.getPrinciple(1)).to.equal(newPrinciple);
    });

    it("2.1.4 should remove principle", async () => {
      await constitution.removePrinciple(1);
      expect(constitution.getPrinciple(1)).to.revertedWith(
        "Invalid Principle Id"
      );
    });
  });

  describe("2.2 Constitution Strategies", async () => {
    const strategy = "strategy1";
    beforeEach(async () => {
      await constitution.addStrategy(strategy);
    });

    it("2.2.1 should add new strategy", async () => {
      expect(await constitution.getStrategy(1)).to.equal(strategy);
    });

    it("2.2.2 should add 2 new strategy", async () => {
      await constitution.addStrategy("new one 2");
      await constitution.addStrategy("new one");

      expect(await constitution.getStrategies()).to.have.lengthOf(3);
    });

    it("2.2.3 should edit strategy", async () => {
      const newStrategy = "strategy2";
      await constitution.updateStrategy(1, newStrategy);
      expect(await constitution.getStrategy(1)).to.equal(newStrategy);
    });

    it("2.2.4 should remove strategy", async () => {
      await constitution.removeStrategy(1);
      expect(constitution.getStrategy(1)).to.revertedWith(
        "Invalid Strategy Id"
      );
    });
  });

  it("2.3 should upgrade successfully with new features", async () => {
    expect(await constitution.getVersion()).to.equal(1);

    const Contract = await ethers.getContractFactory("ICVCMConstitution");
    const constitution2 = (await upgrades.upgradeProxy(
      constitution.address,
      Contract
    )) as ICVCMConstitution;

    expect(await constitution2.getVersion()).to.equal(2);
  });
});
