import { ethers } from "hardhat";
import { ICVCMToken, ICVCMGovernor } from "../typechain";

export const deployContracts = async (): Promise<
  [ICVCMToken, ICVCMGovernor]
> => {
  // Deploy ICVCMToken
  const ICVCMTokenContract = await ethers.getContractFactory("ICVCMToken");
  const ICVCMToken = await ICVCMTokenContract.deploy();
  await ICVCMToken.deployed();

  console.log("ICVCMToken deployed to:", ICVCMToken.address);

  // Deploy Governor
  const ICVCMGovernorContract = await ethers.getContractFactory(
    "ICVCMGovernor"
  );
  const ICVCMGovernor = await ICVCMGovernorContract.deploy(ICVCMToken.address);
  await ICVCMGovernor.deployed();

  console.log("ICVCMGovernor deployed to:", ICVCMGovernor.address);

  return [ICVCMToken, ICVCMGovernor];
};
