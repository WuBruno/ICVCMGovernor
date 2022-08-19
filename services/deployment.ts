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
  enableRoleOwnershipTransfer = true
): Promise<[ICVCMToken, ICVCMGovernor, ICVCMRoles, ICVCMConstitution]> {
  const token: ICVCMToken = await deployICVCMToken();
  const constitution: ICVCMConstitution = await deployICVCMConstitution();
  const roles: ICVCMRoles = await deployICVCMRoles(token.address);
  const governor: ICVCMGovernor = await deployICVCMGovernor(
    token.address,
    roles.address
  );

  const authorizations = [
    [roles.address, roles.interface.getSighash("addMember"), Roles.Director],
    [roles.address, roles.interface.getSighash("removeMember"), Roles.Director],
    [
      constitution.address,
      constitution.interface.getSighash("addPrinciple"),
      Roles.Director,
    ],
    [
      constitution.address,
      constitution.interface.getSighash("addPrinciple"),
      Roles.Expert,
    ],
    [
      constitution.address,
      constitution.interface.getSighash("updatePrinciple"),
      Roles.Director,
    ],
    [
      constitution.address,
      constitution.interface.getSighash("updatePrinciple"),
      Roles.Expert,
    ],
    [
      constitution.address,
      constitution.interface.getSighash("removePrinciple"),
      Roles.Director,
    ],
    [
      constitution.address,
      constitution.interface.getSighash("removePrinciple"),
      Roles.Expert,
    ],
    [
      constitution.address,
      constitution.interface.getSighash("addStrategy"),
      Roles.Director,
    ],
    [
      constitution.address,
      constitution.interface.getSighash("addStrategy"),
      Roles.Secretariat,
    ],
    [
      constitution.address,
      constitution.interface.getSighash("updateStrategy"),
      Roles.Director,
    ],
    [
      constitution.address,
      constitution.interface.getSighash("updateStrategy"),
      Roles.Secretariat,
    ],
    [
      constitution.address,
      constitution.interface.getSighash("removeStrategy"),
      Roles.Director,
    ],
    [
      constitution.address,
      constitution.interface.getSighash("removeStrategy"),
      Roles.Secretariat,
    ],
    [
      governor.address,
      governor.interface.getSighash("updateQuorumNumerator"),
      Roles.Director,
    ],
    [
      governor.address,
      governor.interface.getSighash("updateQuorumNumerator"),
      Roles.Secretariat,
    ],
    [
      governor.address,
      governor.interface.getSighash("setVotingPeriod"),
      Roles.Director,
    ],
    [
      governor.address,
      governor.interface.getSighash("setVotingPeriod"),
      Roles.Secretariat,
    ],
    [
      governor.address,
      governor.interface.getSighash("upgradeTo"),
      Roles.Director,
    ],
    [
      governor.address,
      governor.interface.getSighash("upgradeTo"),
      Roles.Secretariat,
    ],
    [
      roles.address,
      roles.interface.getSighash("addProposalAuthorization"),
      Roles.Director,
    ],
    [
      roles.address,
      roles.interface.getSighash("addProposalAuthorization"),
      Roles.Secretariat,
    ],
    [
      roles.address,
      roles.interface.getSighash("removeProposalAuthorization"),
      Roles.Director,
    ],
    [
      roles.address,
      roles.interface.getSighash("removeProposalAuthorization"),
      Roles.Secretariat,
    ],
    [roles.address, roles.interface.getSighash("upgradeTo"), Roles.Director],
    [roles.address, roles.interface.getSighash("upgradeTo"), Roles.Secretariat],
    [token.address, token.interface.getSighash("upgradeTo"), Roles.Director],
    [token.address, token.interface.getSighash("upgradeTo"), Roles.Secretariat],
    [
      constitution.address,
      constitution.interface.getSighash("upgradeTo"),
      Roles.Director,
    ],
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

  // Assign token contract ownership to roles contract
  await token.grantRole(await token.ISSUER_ROLE(), roles.address);
  await token.transferAdmin(governor.address);

  await constitution.transferOwnership(governor.address);

  preRoleOwnershipTransfer && (await preRoleOwnershipTransfer(roles));
  enableRoleOwnershipTransfer &&
    (await roles.transferOwnership(governor.address));

  return [token, governor, roles, constitution];
}
