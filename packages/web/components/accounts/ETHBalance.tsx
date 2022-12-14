import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useETHBalance } from "~/hooks/utils";
import { parseBalance } from "~/utils";

const ETHBalance = () => {
  const { account } = useWeb3React<Web3Provider>();
  const { data } = useETHBalance(account);

  return <p>Balance: Ξ{parseBalance(data ?? 0)}</p>;
};

export default ETHBalance;
