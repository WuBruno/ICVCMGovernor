import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import _ from "lodash";
import { useMemo } from "react";
import useSWR from "swr";
import { Roles } from "~/@types/Roles";
import { useICVCMRoles } from "~/hooks/contracts";
import {
  getProposalAuthorizations,
  parseFunctionName,
} from "~/services/members";

type Props = {};

const ProposalAuthorizationList = (props: Props) => {
  const ICVCMRoles = useICVCMRoles();

  const { data } = useSWR("getProposalAuthorizations", async () =>
    getProposalAuthorizations(ICVCMRoles)
  );

  const proposalAuthorizations = useMemo(() => {
    if (!data) {
      return {};
    }

    return _.groupBy(data, (item) => item.contract + item.function);
  }, [data]);

  return (
    <TableContainer component={Paper} sx={{ mb: 2 }}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Proposal Type</TableCell>
            <TableCell align="right">Authorized Roles</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {proposalAuthorizations &&
            _.map(proposalAuthorizations, (row) => (
              <TableRow
                key={
                  row[0].contract.toString() +
                  row[0].function +
                  row[0].role.toString()
                }
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell>{parseFunctionName(row[0].function)}</TableCell>
                <TableCell align="right">
                  {row.map((x) => Roles[x.role]).join(", ")}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ProposalAuthorizationList;
