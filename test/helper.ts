import { ICVCMGovernor, ICVCMRoles, ICVCMToken } from "~/typechain";
import { BigNumberish, ethers } from "ethers";
import { Roles } from "~/@types";

export const createProposal = async (
  governorToken: ICVCMToken,
  governor: ICVCMGovernor,
  callerAddress: string
): Promise<BigNumberish> => {
  const encodedFunctionCall = governorToken.interface.encodeFunctionData(
    "safeMint",
    [callerAddress]
  );

  const proposalTx = await governor.propose(
    [governorToken.address],
    [0],
    [encodedFunctionCall],
    "Test Proposal"
  );
  const proposalReceipt = await proposalTx.wait(1);
  return proposalReceipt.events![0].args!.proposalId;
};

export const voteProposal = async (
  governor: ICVCMGovernor,
  proposalId: BigNumberish,
  support = 1
) => {
  const voteTx = await governor.castVoteWithReason(
    proposalId,
    support,
    "Great example proposal"
  );
  return voteTx.wait(1);
};

export const addMember = async (
  roles: ICVCMRoles,
  memberAddress: string,
  role: Roles,
  name: string
) => {
  return roles.addMember(
    memberAddress,
    role,
    ethers.utils.formatBytes32String(name)
  );
};
