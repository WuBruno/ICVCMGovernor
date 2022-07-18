import { ICVCMGovernor, ICVCMRoles, ICVCMToken } from "~/typechain";
import { BigNumberish, ethers } from "ethers";
import { Roles } from "~/@types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { mine } from "@nomicfoundation/hardhat-network-helpers";

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
  governorToken: ICVCMToken,
  governor: ICVCMGovernor,
  executionAddress: string,
  encodedFunctionCall: string,
  description: string,
  voters: SignerWithAddress[]
) => {
  const proposalId = await createCustomProposal(
    governorToken,
    governor,
    executionAddress,
    encodedFunctionCall,
    description
  );

  for (const voter of voters) {
    await voteProposal(governor.connect(voter), proposalId);
  }

  await mine(300);

  const descriptionHash = ethers.utils.id(description);
  const executionTx = await governor.execute(
    [executionAddress],
    [0],
    [encodedFunctionCall],
    descriptionHash
  );
  await executionTx.wait();

  return proposalId;
};

export const createCustomProposal = async (
  governorToken: ICVCMToken,
  governor: ICVCMGovernor,
  executionAddress: string,
  encodedFunctionCall: string,
  description: string = "Custom Proposal"
) => {
  const proposalTx = await governor.propose(
    [executionAddress],
    [0],
    [encodedFunctionCall],
    description
  );

  const proposalReceipt = await proposalTx.wait(1);
  return proposalReceipt.events![0].args!.proposalId;
};

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
