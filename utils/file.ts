import fs from "fs/promises";

export const writeContractAddresses = async (
  contractAddresses: Object
): Promise<void> => {
  const content = JSON.stringify(contractAddresses, null, 2);
  return fs.writeFile("./contract.json", content);
};
