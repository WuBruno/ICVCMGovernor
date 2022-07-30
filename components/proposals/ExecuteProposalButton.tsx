import { Button } from "@mui/material";
import { Proposal, ProposalState } from "~/@types";
import { Roles } from "~/@types/Roles";
import { useAsync, useICVCMGovernor, useUser } from "~/hooks";
import { executeProposal } from "~/services/proposals";

type Props = {
  proposal: Proposal;
};

function ExecuteProposalButton({ proposal }: Props) {
  const ICVCMGovernor = useICVCMGovernor();
  const { user } = useUser();

  const [_, execute] = useAsync(async () =>
    executeProposal(ICVCMGovernor, proposal)
  );

  if (!user || user.role !== Roles.Regulator)
    return (
      <Button variant="contained" disabled>
        N/A
      </Button>
    );

  switch (proposal.state) {
    case ProposalState.Succeeded:
      return (
        <Button variant="contained" color="success" onClick={() => execute()}>
          Execute
        </Button>
      );
    case ProposalState.Defeated:
      return (
        <Button variant="contained" disabled>
          Rejected
        </Button>
      );
    case ProposalState.Executed:
      return (
        <Button variant="contained" disabled>
          Executed
        </Button>
      );

    default:
      return null;
  }
}

export default ExecuteProposalButton;
