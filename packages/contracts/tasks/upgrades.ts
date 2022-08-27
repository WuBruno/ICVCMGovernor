import { ContractFactory } from "ethers";
import { task } from "hardhat/config";

task("upgrade", "Deploy Contract Implementation")
  .addParam("contract", "Contract to be deployed")
  .setAction(async (taskArgs, hre) => {
    const contract = (await hre.ethers.getContractFactory(
      taskArgs.contract
    )) as ContractFactory;
    const address = await hre.upgrades.deployImplementation(contract);

    console.log(
      "Deployed",
      taskArgs.contract,
      "with address:",
      address.toString()
    );
  });
