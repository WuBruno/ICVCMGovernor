import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";

import { writeContractAddresses } from "~/utils";

task(
  "mint_tokens",
  "Mint ICVCMTokens to all accounts",
  async (taskArgs, hre) => {
    await writeContractAddresses(["123", "123", "123"]);
    console.log("Writing complete");
  }
);
