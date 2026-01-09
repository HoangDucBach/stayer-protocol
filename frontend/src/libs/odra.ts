import { blake2bHex } from "blakejs";
import { CASPER_NODE_ADDRESS } from "@/configs/constants";

// ============== RPC Client ==============

export async function rpcRequest(method: string, params: any) {
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
  // Normalize packageHash - remove "hash-" prefix if present
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
    // Fallback to package hash
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

// ============== Odra Key Generation ==============

/**
 * Generate Odra storage key for a given field index and optional mapping data
 * Odra stores state in a dictionary called "state" with keys derived from field index
 */
export function getOdraKey(
  index: number,
  mappingData: Uint8Array = new Uint8Array([])
): string {
  const buffer = new Uint8Array(4 + mappingData.length);
  const view = new DataView(buffer.buffer);
  view.setUint32(0, index, false); // big-endian for Odra
  buffer.set(mappingData, 4);
  return blake2bHex(buffer, undefined, 32);
}

// ============== Odra Value Parsers ==============

/**
 * Parse a u64 value from Odra CLValue hex
 * Format: 8 bytes length prefix (LE) + 8 bytes u64 (LE)
 */
export function parseOdraU64(hex: string): number {
  try {
    if (!hex || hex.length < 16) return 0;
    // Skip first 8 chars (4 bytes length prefix), read next 16 chars (8 bytes u64)
    const dataHex = hex.substring(8, 24);
    const buffer = Buffer.from(dataHex, "hex");
    return Number(buffer.readBigUInt64LE(0));
  } catch {
    return 0;
  }
}

/**
 * Parse a U256 value from Odra CLValue hex
 */
export function parseOdraU256(hex: string): string {
  try {
    if (!hex || hex.length < 10) return "0";
    // First byte after length is the actual byte length of the number
    const buf = Buffer.from(hex, "hex");
    const lenPrefix = buf.readUInt32LE(0);
    const numBytes = buf[4];
    if (numBytes === 0) return "0";

    // Read the bytes in little-endian
    let result = BigInt(0);
    for (let i = 0; i < numBytes; i++) {
      result += BigInt(buf[5 + i]) * BigInt(256) ** BigInt(i);
    }
    return result.toString();
  } catch {
    return "0";
  }
}

/**
 * Parse a U512 value from Odra CLValue hex (same format as U256)
 */
export function parseOdraU512(hex: string): string {
  return parseOdraU256(hex);
}

/**
 * Parse a boolean value from Odra CLValue hex
 */
export function parseOdraBool(hex: string): boolean {
  try {
    if (!hex || hex.length < 10) return false;
    const buf = Buffer.from(hex, "hex");
    return buf[4] !== 0;
  } catch {
    return false;
  }
}

/**
 * Parse an Address from Odra CLValue hex
 * Address format: 1 byte tag (00=account, 01=contract) + 32 bytes hash
 */
export function parseOdraAddress(hex: string): string | null {
  try {
    if (!hex || hex.length < 74) return null;
    const buf = Buffer.from(hex, "hex");
    const tag = buf[4];
    const hashBytes = buf.slice(5, 37);
    const hashHex = hashBytes.toString("hex");
    return tag === 0 ? `account-hash-${hashHex}` : `hash-${hashHex}`;
  } catch {
    return null;
  }
}

// ============== Contract-Specific Parsers ==============

/**
 * ValidatorData struct from ValidatorRegistry
 * Fields: fee(u64), is_active(bool), decay_factor(u64), p_score(u64), updated_era(u64)
 */
export interface ValidatorData {
  fee: number;
  is_active: boolean;
  decay_factor: number;
  p_score: number;
  updated_era: number;
}

export function parseValidatorData(hex: string): ValidatorData | null {
  try {
    const buf = Buffer.from(hex, "hex");
    let cursor = 4; // Skip length prefix

    const readU64 = () => {
      const val = Number(buf.readBigUInt64LE(cursor));
      cursor += 8;
      return val;
    };

    const readBool = () => {
      const val = buf[cursor] !== 0;
      cursor += 1;
      return val;
    };

    const fee = readU64();
    const is_active = readBool();
    const decay_factor = readU64();
    const p_score = readU64();
    const updated_era = readU64();

    return { fee, is_active, decay_factor, p_score, updated_era };
  } catch {
    return null;
  }
}

/**
 * PriceData struct from PriceOracle
 * Fields: price(U256), updated_at(u64), round_id(u64)
 */
export interface PriceData {
  price: string;
  updated_at: number;
  round_id: number;
}

export function parsePriceData(hex: string): PriceData | null {
  try {
    const buf = Buffer.from(hex, "hex");
    let cursor = 4; // Skip length prefix

    // Parse U256 - first byte is length of number
    const numBytes = buf[cursor];
    cursor += 1;
    let price = BigInt(0);
    for (let i = 0; i < numBytes; i++) {
      price += BigInt(buf[cursor + i]) * BigInt(256) ** BigInt(i);
    }
    cursor += numBytes;

    // Parse u64s
    const updated_at = Number(buf.readBigUInt64LE(cursor));
    cursor += 8;
    const round_id = Number(buf.readBigUInt64LE(cursor));

    return { price: price.toString(), updated_at, round_id };
  } catch {
    return null;
  }
}

/**
 * VaultParams struct from StayerVault
 * Fields: ltv(u64), liq_threshold(u64), liq_penalty(u64), stability_fee(u64), min_collateral(U256)
 */
export interface VaultParams {
  ltv: number;
  liq_threshold: number;
  liq_penalty: number;
  stability_fee: number;
  min_collateral: string;
}

export function parseVaultParams(hex: string): VaultParams | null {
  try {
    const buf = Buffer.from(hex, "hex");
    let cursor = 4;

    const readU64 = () => {
      const val = Number(buf.readBigUInt64LE(cursor));
      cursor += 8;
      return val;
    };

    const ltv = readU64();
    const liq_threshold = readU64();
    const liq_penalty = readU64();
    const stability_fee = readU64();

    // Parse U256 min_collateral
    const numBytes = buf[cursor];
    cursor += 1;
    let min_collateral = BigInt(0);
    for (let i = 0; i < numBytes; i++) {
      min_collateral += BigInt(buf[cursor + i]) * BigInt(256) ** BigInt(i);
    }

    return {
      ltv,
      liq_threshold,
      liq_penalty,
      stability_fee,
      min_collateral: min_collateral.toString(),
    };
  } catch {
    return null;
  }
}

/**
 * Position struct from StayerVault
 * Fields: owner(Address), collateral(U256), debt(U256), entry_price(U256), opened_at(u64)
 */
export interface Position {
  owner: string | null;
  collateral: string;
  debt: string;
  entry_price: string;
  opened_at: number;
}

export function parsePosition(hex: string): Position | null {
  try {
    const buf = Buffer.from(hex, "hex");
    let cursor = 4;

    // Parse Address (1 byte tag + 32 bytes hash)
    const tag = buf[cursor];
    cursor += 1;
    const hashBytes = buf.slice(cursor, cursor + 32);
    cursor += 32;
    const owner =
      tag === 0
        ? `account-hash-${hashBytes.toString("hex")}`
        : `hash-${hashBytes.toString("hex")}`;

    // Parse U256 helper
    const parseU256 = () => {
      const numBytes = buf[cursor];
      cursor += 1;
      let val = BigInt(0);
      for (let i = 0; i < numBytes; i++) {
        val += BigInt(buf[cursor + i]) * BigInt(256) ** BigInt(i);
      }
      cursor += numBytes;
      return val.toString();
    };

    const collateral = parseU256();
    const debt = parseU256();
    const entry_price = parseU256();
    const opened_at = Number(buf.readBigUInt64LE(cursor));

    return { owner, collateral, debt, entry_price, opened_at };
  } catch {
    return null;
  }
}

/**
 * WithdrawalRequest struct from LiquidStaking
 * Fields: user(Address), amount(U512), unlock_era(u64), status(enum)
 */
export interface WithdrawalRequest {
  user: string | null;
  amount: string;
  unlock_era: number;
  status: "Pending" | "Claimed";
}

export function parseWithdrawalRequest(hex: string): WithdrawalRequest | null {
  try {
    const buf = Buffer.from(hex, "hex");
    let cursor = 4;

    // Parse Address
    const tag = buf[cursor];
    cursor += 1;
    const hashBytes = buf.slice(cursor, cursor + 32);
    cursor += 32;
    const user =
      tag === 0
        ? `account-hash-${hashBytes.toString("hex")}`
        : `hash-${hashBytes.toString("hex")}`;

    // Parse U512 (same format as U256)
    const numBytes = buf[cursor];
    cursor += 1;
    let amount = BigInt(0);
    for (let i = 0; i < numBytes; i++) {
      amount += BigInt(buf[cursor + i]) * BigInt(256) ** BigInt(i);
    }
    cursor += numBytes;

    const unlock_era = Number(buf.readBigUInt64LE(cursor));
    cursor += 8;

    // Parse enum (1 byte)
    const statusByte = buf[cursor];
    const status = statusByte === 0 ? "Pending" : "Claimed";

    return { user, amount: amount.toString(), unlock_era, status };
  } catch {
    return null;
  }
}

// ============== Contract Field Indices ==============

/**
 * Odra stores fields in order they appear in struct definition.
 * These indices are used with getOdraKey() to generate dictionary keys.
 */

export const ValidatorRegistryFields = {
  validators: 0, // Mapping<PublicKey, ValidatorData>
  network_p_avg: 1, // Var<u64>
  last_update_era: 2, // Var<u64>
  keeper: 3, // Var<Address>
  owner: 4, // Var<Address>
} as const;

export const PriceOracleFields = {
  price_data: 0, // Var<PriceData>
  max_age: 1, // Var<u64>
  styks_oracle: 2, // Var<Address>
  updaters: 3, // Mapping<Address, bool>
  owner: 4, // Var<Address>
  fallback_price: 5, // Var<U256>
  use_fallback: 6, // Var<bool>
} as const;

export const LiquidStakingFields = {
  validator_registry: 0, // External
  yscspr_token: 1, // External
  auction_contract: 2, // External
  owner: 3, // Var<Address>
  keeper: 4, // Var<Address>
  user_stakes: 5, // Mapping<(Address, PublicKey), U512>
  validator_total_stake: 6, // Mapping<PublicKey, U512>
  total_staked: 7, // Var<U512>
  total_pending_withdrawal: 8, // Var<U512>
  withdrawal_requests: 9, // Mapping<u64, WithdrawalRequest>
  user_pending_withdrawals: 10, // Mapping<Address, Vec<u64>>
  next_request_id: 11, // Var<u64>
  last_harvest_era: 12, // Var<u64>
  cumulative_rewards: 13, // Var<U512>
  treasury_rewards: 14, // Var<U512>
} as const;

export const StayerVaultFields = {
  total_collateral: 0, // Var<U256>
  total_debt: 1, // Var<U256>
  positions: 2, // Mapping<Address, Position>
  params: 3, // Var<VaultParams>
  oracle: 4, // Var<Address>
  cusd_token: 5, // Var<Address>
  yscspr_token: 6, // Var<Address>
  liquid_staking: 7, // Var<Address>
  owner: 8, // Var<Address>
  paused: 9, // Var<bool>
} as const;