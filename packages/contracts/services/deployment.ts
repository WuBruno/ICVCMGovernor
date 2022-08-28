import { ethers, upgrades } from "hardhat";
import { Roles } from "~/@types";
import {
  ICVCMConstitution,
  ICVCMGovernor,
  ICVCMRoles,
  ICVCMToken,
} from "~/typechain";

export const deployICVCMToken = async () => {
  const contractFactory = await ethers.getContractFactory("ICVCMToken");
  const contract = await upgrades.deployProxy(contractFactory, []);
  return contract.deployed() as Promise<ICVCMToken>;
};

export const deployICVCMGovernor = async (
  tokenAddress: string,
  roleAddress: string
) => {
  const contractFactory = await ethers.getContractFactory("ICVCMGovernor");
  const contract = await upgrades.deployProxy(contractFactory, [
    tokenAddress,
    roleAddress,
  ]);
  return contract.deployed() as Promise<ICVCMGovernor>;
};

export const deployICVCMRoles = async (tokenAddress: string) => {
  const contractFactory = await ethers.getContractFactory("ICVCMRoles");
  const contract = await upgrades.deployProxy(contractFactory, [tokenAddress]);
  return contract.deployed() as Promise<ICVCMRoles>;
};

export const deployICVCMConstitution = async (): Promise<ICVCMConstitution> => {
  const contractFactory = await ethers.getContractFactory("ICVCMConstitution");
  const contract = await upgrades.deployProxy(contractFactory, []);
  return contract.deployed() as Promise<ICVCMConstitution>;
};

export async function deployContracts(
  preRoleOwnershipTransfer?: (roles: ICVCMRoles) => Promise<any>,
  enableRoleOwnershipTransfer = true,
  showLogs?: boolean
): Promise<[ICVCMToken, ICVCMGovernor, ICVCMRoles, ICVCMConstitution]> {
  const token: ICVCMToken = await deployICVCMToken();
  const constitution: ICVCMConstitution = await deployICVCMConstitution();
  const roles: ICVCMRoles = await deployICVCMRoles(token.address);
  const governor: ICVCMGovernor = await deployICVCMGovernor(
    token.address,
    roles.address
  );
  showLogs && console.log("Contracts Deployed");

  const authorizations = [
    [roles.address, roles.interface.getSighash("addMember"), Roles.Director],
    [roles.address, roles.interface.getSighash("removeMember"), Roles.Director],
    [
      constitution.address,
      constitution.interface.getSighash("addPrinciple"),
      Roles.Expert,
    ],
    [
      constitution.address,
      constitution.interface.getSighash("updatePrinciple"),
      Roles.Expert,
    ],
    [
      constitution.address,
      constitution.interface.getSighash("removePrinciple"),
      Roles.Expert,
    ],
    [
      constitution.address,
      constitution.interface.getSighash("addStrategy"),
      Roles.Secretariat,
    ],
    [
      constitution.address,
      constitution.interface.getSighash("updateStrategy"),
      Roles.Secretariat,
    ],
    [
      constitution.address,
      constitution.interface.getSighash("removeStrategy"),
      Roles.Secretariat,
    ],
    [
      governor.address,
      governor.interface.getSighash("updateQuorumNumerator"),
      Roles.Secretariat,
    ],
    [
      governor.address,
      governor.interface.getSighash("setVotingPeriod"),
      Roles.Secretariat,
    ],
    [
      governor.address,
      governor.interface.getSighash("upgradeTo"),
      Roles.Secretariat,
    ],
    [
      roles.address,
      roles.interface.getSighash("addProposalAuthorization"),
      Roles.Secretariat,
    ],
    [
      roles.address,
      roles.interface.getSighash("removeProposalAuthorization"),
      Roles.Secretariat,
    ],
    [roles.address, roles.interface.getSighash("upgradeTo"), Roles.Secretariat],
    [token.address, token.interface.getSighash("upgradeTo"), Roles.Secretariat],
    [
      constitution.address,
      constitution.interface.getSighash("upgradeTo"),
      Roles.Secretariat,
    ],
  ] as const;

  // Assign authorization of contracts
  await roles.batchAddProposalAuthorization(
    authorizations.map((v) => v[0]),
    authorizations.map((v) => v[1]),
    authorizations.map((v) => v[2])
  );
  showLogs && console.log("Proposal Authorizations Added");

  // Assign token contract ownership to roles contract
  await token.grantRole(await token.ISSUER_ROLE(), roles.address);
  showLogs && console.log("Token Issuer role assigned to ICVCMRoles");

  await token.transferAdmin(governor.address);
  showLogs && console.log("ICVCMToken Admin role assigned to ICVCMGovernor");

  await constitution.transferOwnership(governor.address);
  showLogs &&
    console.log("ICVCMConstitution ownership transferred to ICVCMGovernor");

  preRoleOwnershipTransfer && (await preRoleOwnershipTransfer(roles));
  enableRoleOwnershipTransfer &&
    (await roles.transferOwnership(governor.address));
  showLogs && console.log("ICVCMRoles ownership transferred to ICVCMGovernor");

  return [token, governor, roles, constitution];
}
