import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import * as dotenv from "dotenv";
import { BigNumberish, ethers } from "ethers";
import { Roles } from "~/@types";
import { ICVCMGovernor, ICVCMRoles } from "~/typechain";

dotenv.config();

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

export const createAndPassProposal = async (
  governor: ICVCMGovernor,
  executionAddress: string,
  encodedFunctionCall: string,
  description: string,
  voters: SignerWithAddress[],
  regulator: SignerWithAddress
) => {
  const proposalId = await createProposal(
    governor,
    executionAddress,
    encodedFunctionCall,
    description
  );

  for (const voter of voters) {
    await voteProposal(governor.connect(voter), proposalId);
  }

  await executeProposal(
    governor,
    executionAddress,
    encodedFunctionCall,
    description,
    regulator
  );

  return proposalId;
};

export const createProposal = async (
  governor: ICVCMGovernor,
  executionAddress: string,
  encodedFunctionCall: string,
  description: string
): Promise<BigNumberish> => {
  const proposalTx = await governor.propose(
    [executionAddress],
    [0],
    [encodedFunctionCall],
    description
  );

  const proposalReceipt = await proposalTx.wait(1);
  return proposalReceipt.events![0].args!.proposalId;
};

export const executeProposal = async (
  governor: ICVCMGovernor,
  executionAddress: string,
  encodedFunctionCall: string,
  description: string,
  executor: SignerWithAddress
) => {
  const descriptionHash = ethers.utils.id(description);
  const executionTx = await governor
    .connect(executor)
    .execute([executionAddress], [0], [encodedFunctionCall], descriptionHash);
  return executionTx.wait();
};

export const cancelProposal = async (
  governor: ICVCMGovernor,
  executionAddress: string,
  encodedFunctionCall: string,
  description: string,
  executor: SignerWithAddress,
  reason: string
) => {
  const descriptionHash = ethers.utils.id(description);
  const executionTx = await governor
    .connect(executor)
    .cancel(
      [executionAddress],
      [0],
      [encodedFunctionCall],
      descriptionHash,
      reason
    );
  return executionTx.wait();
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
