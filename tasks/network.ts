import { mine } from "@nomicfoundation/hardhat-network-helpers";
import { task } from "hardhat/config";

task("mine", "Mining", async (taskArgs, hre) => {
  await mine(Number(process.env.VOTING_PERIOD));
});
