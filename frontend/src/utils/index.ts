import numbro from "numbro";
import BigNumber from "bignumber.js";

export function formatAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatNumber(
  amount: number | string,
  {
    decimals = 2,
    compact = false,
  }: {
    decimals?: number;
    compact?: boolean;
  } = {}
): string {
  const value = new BigNumber(amount);

  return numbro(value.toNumber()).format({
    thousandSeparated: !compact,
    average: compact,
    mantissa: decimals,
  });
}

export function formatCurrency(
  amount: number | string,
  decimals: number = 2
): string {
  const value = new BigNumber(amount);
  return numbro(value.toNumber()).formatCurrency({
    mantissa: decimals,
    thousandSeparated: true,
    average: true
  });
}

export function formatToken(
  amount: number | string,
  {
    symbol,
    decimals = 0,
    chainDecimals,
    compact = false,
  }: {
    symbol: string;
    decimals?: number;
    chainDecimals?: number;
    compact?: boolean;
  }
): string {
  let value = new BigNumber(amount);

  if (chainDecimals) {
    value = value.dividedBy(new BigNumber(10).pow(chainDecimals));
  }

  return `${formatNumber(value.toString(), {
    decimals,
    compact,
  })} ${symbol}`;
}

export function formatCompact(
  amount: number | string,
  decimals: number = 1
): string {
  const value = new BigNumber(amount);
  return numbro(value.toNumber()).format({ average: true, mantissa: decimals });
}

export function formatPercentage(value: number, decimals: number = 2, isFloat: boolean = true): string {
  if (!isFloat) {
    return `${value.toFixed(decimals)}%`;
  }
  return `${(value * 100).toFixed(decimals)}%`;
}
