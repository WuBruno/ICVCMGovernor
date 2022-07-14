import { ethers } from "hardhat";
import {
  ICVCMRoles,
  ICVCMToken,
  ICVCMGovernor,
  ICVCMConstitution,
} from "~/typechain";

export const deployICVCMToken = async () => {
  const contractFactory = await ethers.getContractFactory("ICVCMToken");
  const contract = await contractFactory.deploy();
  return contract.deployed();
};

export const deployICVCMGovernor = async (
  tokenAddress: string,
  constitutionAddress: string
) => {
  const contractFactory = await ethers.getContractFactory("ICVCMGovernor");
  const contract = await contractFactory.deploy(
    tokenAddress,
    constitutionAddress
  );
  return contract.deployed();
};

export const deployICVCMRoles = async (tokenAddress: string) => {
  const contractFactory = await ethers.getContractFactory("ICVCMRoles");
  const contract = await contractFactory.deploy(tokenAddress);
  return contract.deployed();
};

export const deployICVCMConstitution = async () => {
  const contractFactory = await ethers.getContractFactory("ICVCMConstitution");
  const contract = await contractFactory.deploy();
  return contract.deployed();
};

export const deployContracts = async (): Promise<
  [ICVCMToken, ICVCMGovernor, ICVCMRoles, ICVCMConstitution]
> => {
  const token: ICVCMToken = await deployICVCMToken();
  const constitution: ICVCMConstitution = await deployICVCMConstitution();
  const governor: ICVCMGovernor = await deployICVCMGovernor(
    token.address,
    constitution.address
  );
  const roles: ICVCMRoles = await deployICVCMRoles(token.address);

  // Assign token contract ownership to roles contract
  await token.transferOwnership(roles.address);
  await constitution.transferOwnership(governor.address);

  return [token, governor, roles, constitution];
};
