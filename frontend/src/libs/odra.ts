import { blake2bHex } from "blakejs";
import { CASPER_NODE_ADDRESS } from "@/configs/constants";

export async function rpcRequest(method: string, params: unknown) {
  const response = await fetch(CASPER_NODE_ADDRESS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: Date.now(), jsonrpc: "2.0", method, params }),
    cache: "no-store",
  });
  const json = await response.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
}

export async function getStateRootHash(): Promise<string> {
  const res = await rpcRequest("chain_get_state_root_hash", []);
  return res.state_root_hash;
}

export async function getActiveContractHash(
  stateRootHash: string,
  packageHash: string
): Promise<string> {
  const cleanHash = packageHash.replace(/^hash-/, "");
  try {
    const pkgRes = await rpcRequest("state_get_item", {
      state_root_hash: stateRootHash,
      key: `hash-${cleanHash}`,
      path: [],
    });
    const pkg =
      pkgRes.stored_value?.ContractPackage ||
      pkgRes.stored_value?.contract_package;
    if (pkg?.versions?.length) {
      return pkg.versions[pkg.versions.length - 1].contract_hash.replace(
        "contract-",
        ""
      );
    }
  } catch {
    /* fallback to package hash */
  }
  return cleanHash;
}

export async function queryDictionaryState(
  stateRoot: string,
  contractKey: string,
  dictionaryName: string,
  keyHex: string
): Promise<string | null> {
  try {
    const res = await rpcRequest("state_get_dictionary_item", {
      state_root_hash: stateRoot,
      dictionary_identifier: {
        ContractNamedKey: {
          key: contractKey,
          dictionary_name: dictionaryName,
          dictionary_item_key: keyHex,
        },
      },
    });
    return (
      res.stored_value?.CLValue?.bytes || res.stored_value?.CLValue?.parsed
    );
  } catch {
    return null;
  }
}

export function getOdraKey(
  index: number,
  mappingData: Uint8Array = new Uint8Array([])
): string {
  const buffer = new Uint8Array(4 + mappingData.length);
  const view = new DataView(buffer.buffer);
  view.setUint32(0, index, false);
  buffer.set(mappingData, 4);
  return blake2bHex(buffer, undefined, 32);
}

class BufferReader {
  private cursor = 4;
  constructor(private buf: Buffer) {}

  readU64(): number {
    const val = Number(this.buf.readBigUInt64LE(this.cursor));
    this.cursor += 8;
    return val;
  }

  readBool(): boolean {
    const val = this.buf[this.cursor] !== 0;
    this.cursor += 1;
    return val;
  }

  readU256(): string {
    const numBytes = this.buf[this.cursor];
    this.cursor += 1;
    if (numBytes === 0) return "0";
    let val = BigInt(0);
    for (let i = 0; i < numBytes; i++) {
      val += BigInt(this.buf[this.cursor + i]) * BigInt(256) ** BigInt(i);
    }
    this.cursor += numBytes;
    return val.toString();
  }

  readAddress(): string {
    const tag = this.buf[this.cursor];
    this.cursor += 1;
    const hashBytes = this.buf.slice(this.cursor, this.cursor + 32);
    this.cursor += 32;
    return tag === 0
      ? `account-hash-${hashBytes.toString("hex")}`
      : `hash-${hashBytes.toString("hex")}`;
  }
}

export function parseOdraU64(hex: string): number {
  try {
    if (!hex || hex.length < 16) return 0;
    const dataHex = hex.substring(8, 24);
    const buffer = Buffer.from(dataHex, "hex");
    return Number(buffer.readBigUInt64LE(0));
  } catch {
    return 0;
  }
}

export function parseOdraU256(hex: string): string {
  try {
    if (!hex || hex.length < 10) return "0";
    const reader = new BufferReader(Buffer.from(hex, "hex"));
    return reader.readU256();
  } catch {
    return "0";
  }
}

export function parseOdraU512(hex: string): string {
  return parseOdraU256(hex);
}

export function parseOdraBool(hex: string): boolean {
  try {
    if (!hex || hex.length < 10) return false;
    const buf = Buffer.from(hex, "hex");
    return buf[4] !== 0;
  } catch {
    return false;
  }
}

export function parseOdraAddress(hex: string): string | null {
  try {
    if (!hex || hex.length < 74) return null;
    const reader = new BufferReader(Buffer.from(hex, "hex"));
    return reader.readAddress();
  } catch {
    return null;
  }
}

export interface ValidatorData {
  fee: number;
  is_active: boolean;
  decay_factor: number;
  p_score: number;
  updated_era: number;
}

export function parseValidatorData(hex: string): ValidatorData | null {
  try {
    const reader = new BufferReader(Buffer.from(hex, "hex"));
    return {
      fee: reader.readU64(),
      is_active: reader.readBool(),
      decay_factor: reader.readU64(),
      p_score: reader.readU64(),
      updated_era: reader.readU64(),
    };
  } catch {
    return null;
  }
}

export interface PriceData {
  price: string;
  updated_at: number;
  round_id: number;
}

export function parsePriceData(hex: string): PriceData | null {
  try {
    const reader = new BufferReader(Buffer.from(hex, "hex"));
    return {
      price: reader.readU256(),
      updated_at: reader.readU64(),
      round_id: reader.readU64(),
    };
  } catch {
    return null;
  }
}

export interface VaultParams {
  ltv: number;
  liq_threshold: number;
  liq_penalty: number;
  stability_fee: number;
  min_collateral: string;
}

export function parseVaultParams(hex: string): VaultParams | null {
  try {
    const reader = new BufferReader(Buffer.from(hex, "hex"));
    return {
      ltv: reader.readU64(),
      liq_threshold: reader.readU64(),
      liq_penalty: reader.readU64(),
      stability_fee: reader.readU64(),
      min_collateral: reader.readU256(),
    };
  } catch {
    return null;
  }
}

export interface Position {
  owner: string | null;
  collateral: string;
  debt: string;
  entry_price: string;
  opened_at: number;
}

export function parsePosition(hex: string): Position | null {
  try {
    const reader = new BufferReader(Buffer.from(hex, "hex"));
    return {
      owner: reader.readAddress(),
      collateral: reader.readU256(),
      debt: reader.readU256(),
      entry_price: reader.readU256(),
      opened_at: reader.readU64(),
    };
  } catch {
    return null;
  }
}

export interface WithdrawalRequest {
  user: string | null;
  amount: string;
  unlock_era: number;
  status: "Pending" | "Claimed";
}

export function parseWithdrawalRequest(hex: string): WithdrawalRequest | null {
  try {
    const reader = new BufferReader(Buffer.from(hex, "hex"));
    const user = reader.readAddress();
    const amount = reader.readU256();
    const unlock_era = reader.readU64();
    const status = reader.readBool() ? "Claimed" : "Pending";
    return { user, amount, unlock_era, status };
  } catch {
    return null;
  }
}

export const ValidatorRegistryFields = {
  validators: 0,
  network_p_avg: 1,
  last_update_era: 2,
  keeper: 3,
  owner: 4,
} as const;

export const PriceOracleFields = {
  price_data: 0,
  max_age: 1,
  styks_oracle: 2,
  updaters: 3,
  owner: 4,
  fallback_price: 5,
  use_fallback: 6,
} as const;

export const LiquidStakingFields = {
  validator_registry: 0,
  yscspr_token: 1,
  auction_contract: 2,
  owner: 3,
  keeper: 4,
  user_stakes: 5,
  validator_total_stake: 6,
  total_staked: 7,
  total_pending_withdrawal: 8,
  withdrawal_requests: 9,
  user_pending_withdrawals: 10,
  next_request_id: 11,
  last_harvest_era: 12,
  cumulative_rewards: 13,
  treasury_rewards: 14,
} as const;

export const StayerVaultFields = {
  total_collateral: 0,
  total_debt: 1,
  positions: 2,
  params: 3,
  oracle: 4,
  cusd_token: 5,
  yscspr_token: 6,
  liquid_staking: 7,
  owner: 8,
  paused: 9,
} as const;
