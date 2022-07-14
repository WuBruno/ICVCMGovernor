// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { ethers } from "hardhat";
import { Roles } from "~/@types";
import { deployContracts } from "~/services/deployment";
import { addMember } from "~/test/helper";
import { writeContractAddresses } from "~/utils";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  await hre.run("compile");

  const [ICVCMToken, ICVCMGovernor, ICVCMRoles] = await deployContracts();
  console.log("ICVCMToken deployed to:", ICVCMToken.address);
  console.log("ICVCMGovernor deployed to:", ICVCMGovernor.address);

  // Write addresses
  await writeContractAddresses({
    ICVCMGovernor: ICVCMGovernor.address,
    ICVCMToken: ICVCMToken.address,
    ICVCMRoles: ICVCMRoles.address,
  });

  // Mint Tokens
  const accounts = await ethers.getSigners();
  await accounts.forEach(async (account, index) =>
    addMember(
      ICVCMRoles,
      account.address,
      Roles.Director,
      `Director${index + 1}`
    )
  );

  console.log("Account minted a token");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
