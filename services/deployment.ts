import { ethers } from "hardhat";
import { ICVCMRoles } from "~/typechain";
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

export const deployICVCMRoles = async (tokenAddress: string) => {
  const contractFactory = await ethers.getContractFactory("ICVCMRoles");
  const contract = await contractFactory.deploy(tokenAddress);
  return contract.deployed();
};

export const deployContracts = async (): Promise<
  [ICVCMToken, ICVCMGovernor, ICVCMRoles]
> => {
  const token: ICVCMToken = await deployICVCMToken();
  const governor: ICVCMGovernor = await deployICVCMGovernor(token.address);
  const roles: ICVCMRoles = await deployICVCMRoles(token.address);

  // Assign token contract ownership to roles contract
  await token.transferOwnership(roles.address);

  return [token, governor, roles];
};
