import React, { } from "react";
import { Container, Typography } from "@mui/material";
import { useWeb3React } from "@web3-react/core";

import useICVCMToken from "../hooks/useICVCMToken";
import ContractAddress from '~/contract.json';
import { ETHBalance, TokenBalance } from "~/components/accounts";
import { ProposalList, ProposeButton } from "~/components/proposals";
import { Navbar } from "~/components/common";

function Home() {
  const { account, library } = useWeb3React();

  const ICVCMToken = useICVCMToken();

  const isConnected = typeof account === "string" && !!library;

  return (
    <div>
      <Navbar />

      <Container maxWidth="md" sx={{ marginTop: 5 }}>

        <Typography color="textPrimary" variant="h2" textAlign="center">
          ICVCM Governance
        </Typography >

        {isConnected && (
          <section>
            <ETHBalance />

            <TokenBalance tokenAddress={ContractAddress.ICVCMToken} symbol="ICVCM" />
          </section>
        )}

        <ProposeButton />

        <ProposalList />

      </Container>

    </div>
  );
}

export default Home;
