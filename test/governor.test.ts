import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumberish } from "ethers";
import { ethers } from "hardhat";
import { deployContracts } from "~/services/deployment";
import { ICVCMGovernor, ICVCMToken } from "~/typechain";
import { moveBlocks } from "~/utils";

const createProposal = async (
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

const voteProposal = async (
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

describe("Governor Contract", async () => {
  let governor: ICVCMGovernor;
  let governorToken: ICVCMToken;
  let owner: SignerWithAddress;
  let user2: SignerWithAddress;
  let proposalId: BigNumberish;

  beforeEach(async () => {
    // Deploy ICVCMTokenContract
    [governorToken, governor] = await deployContracts();

    [owner, user2] = await ethers.getSigners();

    await governorToken.safeMint(owner.address);
    await governorToken.delegate(owner.address);

    await governorToken.safeMint(user2.address);
    await governorToken.delegate(user2.address);

    proposalId = await createProposal(governorToken, governor, owner.address);
    await moveBlocks(1);
  });

  it("should create proposal", async () => {
    expect(await governor.state(proposalId), "Proposal not created").to.equal(
      1
    );
  });

  describe("Vote on Proposals", () => {
    it("should vote for the proposal", async () => {
      await voteProposal(governor, proposalId);
      expect(await governor.hasVoted(proposalId, owner.address)).to.equal(true);
    });

    it("should vote against the proposal", async () => {
      await voteProposal(governor, proposalId, 0);
      expect(await governor.hasVoted(proposalId, owner.address)).to.equal(true);
    });
  });

  describe("Proposals Outcomes", () => {
    it("should vote for and succeed proposal", async () => {
      await voteProposal(governor, proposalId);
      await voteProposal(governor.connect(user2), proposalId);

      await moveBlocks(300);

      expect(
        await governor.state(proposalId),
        "Proposal not succeeded"
      ).to.equal(4);
    });

    it("should vote against proposal and defeat", async () => {
      await voteProposal(governor, proposalId, 0);
      await voteProposal(governor.connect(user2), proposalId, 0);

      await moveBlocks(300);

      expect(
        await governor.state(proposalId),
        "Proposal not defeated"
      ).to.equal(3);
    });
  });
});
