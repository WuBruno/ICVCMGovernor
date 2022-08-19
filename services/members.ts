import { parseBytes32String } from "ethers/lib/utils";
import {
  Contracts,
  Member,
  ProposalAuthorization,
  Roles,
} from "~/@types/Roles";
import ContractAddress from "~/contract.json";
import {
  ICVCMConstitution__factory,
  ICVCMGovernor__factory,
  ICVCMRoles,
  ICVCMRoles__factory,
} from "~/contracts/types";

export const getMember = async (
  ICVCMRoles: ICVCMRoles,
  memberAddress: string
): Promise<Member | undefined> => {
  try {
    const member = await ICVCMRoles.getMember(memberAddress);
    return {
      ...member,
      name: parseBytes32String(member.name),
      memberAddress,
    };
  } catch (errors) {}
};

export const getMembers = async (ICVCMRoles: ICVCMRoles): Promise<Member[]> =>
  ICVCMRoles.getMembers();

export const getProposalAuthorizations = async (
  ICVCMRoles: ICVCMRoles
): Promise<ProposalAuthorization[]> => {
  const authorizations = await ICVCMRoles.getProposalAuthorizations();

  return authorizations.map(({ contractAddress, selector, role }) =>
    parseProposalAuthorization(contractAddress, selector, role)
  );
};

export const parseProposalAuthorization = (
  contractAddress: string,
  selector: string,
  role: Roles
) => {
  switch (contractAddress) {
    case ContractAddress.ICVCMGovernor:
      return {
        contract: Contracts.ICVCMGovernor,
        role,
        function:
          ICVCMGovernor__factory.createInterface().getFunction(selector).name,
      };
    case ContractAddress.ICVCMRoles:
      return {
        contract: Contracts.ICVCMRoles,
        role,
        function:
          ICVCMRoles__factory.createInterface().getFunction(selector).name,
      };
    case ContractAddress.ICVCMConstitution:
      return {
        contract: Contracts.ICVCMConstitution,
        role,
        function:
          ICVCMConstitution__factory.createInterface().getFunction(selector)
            .name,
      };
  }
};

export const functionNames = {
  addMember: "Add Member",
  removeMember: "Remove Member",
  setPrinciples: "Edit Principles",
  setStrategies: "Edit Strategies",
  updateQuorumNumerator: "Set Voting Quorum",
  setVotingPeriod: "Set Voting Period",
  addProposalAuthorization: "Add Proposal Authorization",
  removeProposalAuthorization: "Remove Proposal Authorization",
  upgradeTo: "Upgrade Contract",
};

export const FunctionContracts = {
  addMember: Contracts.ICVCMRoles,
  removeMember: Contracts.ICVCMRoles,
  setPrinciples: Contracts.ICVCMConstitution,
  setStrategies: Contracts.ICVCMConstitution,
  updateQuorumNumerator: Contracts.ICVCMGovernor,
  setVotingPeriod: Contracts.ICVCMGovernor,
  addProposalAuthorization: Contracts.ICVCMRoles,
  removeProposalAuthorization: Contracts.ICVCMRoles,
  upgradeTo: Contracts.ICVCMGovernor,
};

export const parseFunctionName = (name: string): string => {
  return functionNames[name];
};
