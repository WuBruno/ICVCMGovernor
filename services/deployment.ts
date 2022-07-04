import { ethers } from "hardhat";
import { ICVCMToken, ICVCMGovernor } from "../typechain";

export const deployICVCMToken = async () => {
  const contractFactory = await ethers.getContractFactory("ICVCMToken");
  const contract = await contractFactory.deploy();
  return contract.deployed();
};

export const deployICVCMGovernor = async (tokenAddress: string) => {
  const contractFactory = await ethers.getContractFactory("ICVCMGovernor");
  const contract = await contractFactory.deploy(tokenAddress);
  return contract.deployed();
};

export const deployContracts = async (): Promise<
  [ICVCMToken, ICVCMGovernor]
> => {
  // Deploy ICVCMToken
  const token: ICVCMToken = await deployICVCMToken();
  const governor: ICVCMGovernor = await deployICVCMGovernor(token.address);

  return [token, governor];
};
