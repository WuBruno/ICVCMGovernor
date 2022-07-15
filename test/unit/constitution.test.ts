import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { deployICVCMConstitution } from "~/services/deployment";
import { ICVCMConstitution } from "~/typechain";

describe("Constitution Contract", async () => {
  let user: SignerWithAddress;
  let constitution: ICVCMConstitution;

  beforeEach(async () => {
    constitution = await deployICVCMConstitution();

    [user] = await ethers.getSigners();
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
});
