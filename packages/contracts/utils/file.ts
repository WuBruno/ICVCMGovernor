import fs from "fs/promises";
import { ContractAddresses } from "~/@types";

export const writeContractAddresses = async (
  contractAddresses: ContractAddresses
): Promise<void> => {
  const content = JSON.stringify(contractAddresses, null, 2);
  return fs.writeFile("./contract.json", content);
};
