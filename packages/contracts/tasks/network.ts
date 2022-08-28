import { mine } from "@nomicfoundation/hardhat-network-helpers";
import { task } from "hardhat/config";

task("mine", "Mining", async (taskArgs, hre) => {
  await mine();
});
