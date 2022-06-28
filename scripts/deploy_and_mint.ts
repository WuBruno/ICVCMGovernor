// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { ethers } from "hardhat";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  await hre.run("compile");

  // Deploy ICVCMToken
  const ICVCMTokenContract = await ethers.getContractFactory("ICVCMToken");
  const ICVCMToken = await ICVCMTokenContract.deploy();
  await ICVCMToken.deployed();

  console.log("ICVCMToken deployed to:", ICVCMToken.address);

  // Mint Tokens
  const accounts = await ethers.getSigners();
  await Promise.all(
    accounts.map(async (account) => ICVCMToken.safeMint(account.address))
  );
  console.log("Account minted a token");

  // Deploy Governor
  const ICVCMGovernorContract = await ethers.getContractFactory(
    "ICVCMGovernor"
  );
  const ICVCMGovernor = await ICVCMGovernorContract.deploy(ICVCMToken.address);
  await ICVCMGovernor.deployed();

  console.log("ICVCMGovernor deployed to:", ICVCMGovernor.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
