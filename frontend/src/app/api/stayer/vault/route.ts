import { NextRequest, NextResponse } from "next/server";
import { STAYER_VAULT_CONTRACT } from "@/configs/constants";
import {
  getStateRootHash,
  getActiveContractHash,
  queryDictionaryState,
  getOdraKey,
  parseOdraU256,
  parseOdraBool,
  parseVaultParams,
  parsePosition,
} from "@/libs/odra";
import { PublicKey } from "casper-js-sdk";

const VaultFields = {
  total_collateral: 1,
  total_debt: 2,
  positions: 3,
  params: 4,
  paused: 10,
} as const;

function parseUserToBytes(userStr: string): Buffer | null {
  try {
    if (userStr.startsWith("account-hash-")) {
      const hashHex = userStr.replace("account-hash-", "");
      return Buffer.concat([Buffer.from([0]), Buffer.from(hashHex, "hex")]);
    }
    if (userStr.startsWith("hash-")) {
      const hashHex = userStr.replace("hash-", "");
      return Buffer.concat([Buffer.from([1]), Buffer.from(hashHex, "hex")]);
    }
    const pubKey = PublicKey.fromHex(userStr);
    return Buffer.concat([
      Buffer.from([0]),
      Buffer.from(pubKey.accountHash().toBytes()),
    ]);
  } catch {
    return null;
  }
}

type Parser<T> = (hex: string) => T | null;

async function queryField<T>(
  stateRoot: string,
  contractKey: string,
  fieldIndex: number,
  parser: Parser<T>,
  defaultValue: T,
  mappingData?: Buffer
): Promise<T> {
  const key = getOdraKey(fieldIndex, mappingData);
  const hex = await queryDictionaryState(stateRoot, contractKey, "state", key);
  if (!hex) return defaultValue;
  return parser(hex) ?? defaultValue;
}

export async function GET(request: NextRequest) {
  const user = request.nextUrl.searchParams.get("user");

  try {
    const stateRootHash = await getStateRootHash();
    const activeContractHash = await getActiveContractHash(
      stateRootHash,
      STAYER_VAULT_CONTRACT
    );
    const contractKey = activeContractHash.startsWith("hash-")
      ? activeContractHash
      : `hash-${activeContractHash}`;

    const [total_collateral, total_debt, params, paused] = await Promise.all([
      queryField(
        stateRootHash,
        contractKey,
        VaultFields.total_collateral,
        parseOdraU256,
        "0"
      ),
      queryField(
        stateRootHash,
        contractKey,
        VaultFields.total_debt,
        parseOdraU256,
        "0"
      ),
      queryField(
        stateRootHash,
        contractKey,
        VaultFields.params,
        parseVaultParams,
        null
      ),
      queryField(
        stateRootHash,
        contractKey,
        VaultFields.paused,
        parseOdraBool,
        false
      ),
    ]);

    let position = null;
    if (user) {
      const addressBytes = parseUserToBytes(user);
      if (addressBytes) {
        position = await queryField(
          stateRootHash,
          contractKey,
          VaultFields.positions,
          parsePosition,
          null,
          addressBytes
        );
      }
    }

    return NextResponse.json({
      total_collateral,
      total_debt,
      params,
      paused,
      position,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to query vault";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
