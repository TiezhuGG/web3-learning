import { Chain } from "wagmi/chains";

export type Address = `0x${string}`;

export interface ChainType extends Chain {
  icon?: string;
}

export interface BalanceDataProps {
  formatted: string;
  symbol: string;
  decimals: number;
  value: bigint;
}

export interface NetWorkProps {
  id: number;
  name: string;
  icon: string;
}
