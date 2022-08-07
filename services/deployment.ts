import { ethers } from "hardhat";
import { Roles } from "~/@types";
import {
  ICVCMConstitution,
  ICVCMGovernor,
  ICVCMRoles,
  ICVCMToken,
} from "~/typechain";

export const deployICVCMToken = async () => {
  const contractFactory = await ethers.getContractFactory("ICVCMToken");
  const contract = await contractFactory.deploy();
  return contract.deployed();
};

export const deployICVCMGovernor = async (
  tokenAddress: string,
  roleAddress: string
) => {
  const contractFactory = await ethers.getContractFactory("ICVCMGovernor");
  const contract = await contractFactory.deploy(tokenAddress, roleAddress);
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

export async function deployContracts(
  preRoleOwnershipTransfer?: (roles: ICVCMRoles) => Promise<any>,
  enableRoleOwnershipTransfer = true
): Promise<[ICVCMToken, ICVCMGovernor, ICVCMRoles, ICVCMConstitution]> {
  const token: ICVCMToken = await deployICVCMToken();
  const constitution: ICVCMConstitution = await deployICVCMConstitution();
  const roles: ICVCMRoles = await deployICVCMRoles(token.address);
  const governor: ICVCMGovernor = await deployICVCMGovernor(
    token.address,
    roles.address
  );

  // Assign authorization of contracts
  await roles.setProposalAuthorization(
    [
      roles.address,
      roles.address,
      constitution.address,
      constitution.address,
      constitution.address,
      constitution.address,
    ],
    [
      roles.interface.getSighash("addMember"),
      roles.interface.getSighash("removeMember"),
      constitution.interface.getSighash("setPrinciples"),
      constitution.interface.getSighash("setPrinciples"),
      constitution.interface.getSighash("setStrategies"),
      constitution.interface.getSighash("setStrategies"),
    ],
    [
      Roles.Director,
      Roles.Director,
      Roles.Director,
      Roles.Expert,
      Roles.Director,
      Roles.Secretariat,
    ],
    [true, true, true, true, true, true]
  );

  // Assign token contract ownership to roles contract
  await token.transferOwnership(roles.address);
  await constitution.transferOwnership(governor.address);

  preRoleOwnershipTransfer && (await preRoleOwnershipTransfer(roles));
  enableRoleOwnershipTransfer &&
    (await roles.transferOwnership(governor.address));

  return [token, governor, roles, constitution];
}
