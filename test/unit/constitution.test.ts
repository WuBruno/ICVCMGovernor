import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { deployICVCMConstitution } from "~/services/deployment";
import { ICVCMConstitution, ICVCMConstitutionV2 } from "~/typechain";

describe("Constitution Contract", async () => {
  let constitution: ICVCMConstitution;

  beforeEach(async () => {
    constitution = await deployICVCMConstitution();
  });

  it("should set principle", async () => {
    const principle = "hello world";
    const principle2 = "This is a important CCP to get through";

    await constitution.setPrinciples(principle);
    expect(await constitution.getPrinciples(), "Failed to set principle");

    await constitution.setPrinciples(principle2);
    expect(
      await constitution.getPrinciples(),
      "Failed to set second principle"
    );
  });

  it("should set strategies", async () => {
    const strategy = "this is a great strategy";
    const strategy2 = "this is an even better strategy";

    await constitution.setStrategies(strategy);
    expect(await constitution.getStrategies(), "Failed to set strategy");

    await constitution.setStrategies(strategy2);
    expect(await constitution.getStrategies(), "Failed to set second strategy");
  });

  it.only("should upgrade successfully with new features", async () => {
    expect(await constitution.getVersion()).to.equal(1);
    await constitution.setPrinciples("hello");
    await constitution.setStrategies("world");

    const Contract = await ethers.getContractFactory("ICVCMConstitutionV2");
    const constitution2 = (await upgrades.upgradeProxy(
      constitution.address,
      Contract
    )) as ICVCMConstitutionV2;

    expect(await constitution2.getVersion()).to.equal(2);
    expect(await constitution2.getData()).to.deep.equal(["hello", "world"]);
  });
});
