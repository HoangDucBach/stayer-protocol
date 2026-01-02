
import numbro from "numbro";
import BigNumber from "bignumber.js";

export function formatAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}


export function formatCurrency(amount: number | string, decimals: number = 2): string {
  const value = new BigNumber(amount);
  return numbro(value.toNumber()).formatCurrency({ mantissa: decimals });
}

export function formatCompact(amount: number | string, decimals: number = 1): string {
  const value = new BigNumber(amount);
  return numbro(value.toNumber()).format({ average: true, mantissa: decimals });
}

export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}
