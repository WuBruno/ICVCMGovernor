import { ethers } from "hardhat";
import { writeContractAddresses } from "~/utils";
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

  await writeContractAddresses({
    ICVCMGovernor: ICVCMGovernor.address,
    ICVCMToken: ICVCMToken.address,
  });

  return [ICVCMToken, ICVCMGovernor];
};
