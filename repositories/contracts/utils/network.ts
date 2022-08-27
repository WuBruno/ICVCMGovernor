import { network } from "hardhat";

export async function moveBlocks(amount: number) {
  for (let index = 0; index < amount; index++) {
    await network.provider.request({
      method: "evm_mine",
      params: [],
    });
  }
}

export async function moveTime(amount: number) {
  return network.provider.send("evm_increaseTime", [amount]);
}
