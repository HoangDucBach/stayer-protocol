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
  StayerVaultFields,
} from "@/libs/odra";

/**
 * GET /api/stayer/vault
 * Query params:
 *   - user: (optional) user address hash to fetch position
 *
 * Returns:
 *   - total_collateral: Total sCSPR collateral locked
 *   - total_debt: Total cUSD debt outstanding
 *   - params: Vault configuration parameters
 *   - paused: Whether vault is paused
 *   - position: (if user provided) User's position data
 */
export async function GET(request: NextRequest) {
  const user = request.nextUrl.searchParams.get("user");

  try {
    const stateRootHash = await getStateRootHash();
    const activeContractHash = await getActiveContractHash(
      stateRootHash,
      STAYER_VAULT_CONTRACT
    );
    const contractKey = `hash-${activeContractHash}`;

    // Query total_collateral (field index 0)
    const collateralKey = getOdraKey(StayerVaultFields.total_collateral);
    const collateralHex = await queryDictionaryState(
      stateRootHash,
      contractKey,
      "state",
      collateralKey
    );
    const total_collateral = collateralHex
      ? parseOdraU256(collateralHex)
      : "0";

    // Query total_debt (field index 1)
    const debtKey = getOdraKey(StayerVaultFields.total_debt);
    const debtHex = await queryDictionaryState(
      stateRootHash,
      contractKey,
      "state",
      debtKey
    );
    const total_debt = debtHex ? parseOdraU256(debtHex) : "0";

    // Query params (field index 3)
    const paramsKey = getOdraKey(StayerVaultFields.params);
    const paramsHex = await queryDictionaryState(
      stateRootHash,
      contractKey,
      "state",
      paramsKey
    );
    const params = paramsHex ? parseVaultParams(paramsHex) : null;

    // Query paused (field index 9)
    const pausedKey = getOdraKey(StayerVaultFields.paused);
    const pausedHex = await queryDictionaryState(
      stateRootHash,
      contractKey,
      "state",
      pausedKey
    );
    const paused = pausedHex ? parseOdraBool(pausedHex) : false;

    // Query specific user position if user provided
    let position = null;
    if (user) {
      // User address should be in format: account-hash-xxx or hash-xxx
      // Extract the hash part
      const hashMatch = user.match(/(?:account-hash-|hash-)([a-fA-F0-9]+)/);
      if (hashMatch) {
        const addressBytes = Buffer.alloc(33);
        addressBytes[0] = user.startsWith("account-hash-") ? 0 : 1;
        Buffer.from(hashMatch[1], "hex").copy(addressBytes, 1);

        const positionKey = getOdraKey(
          StayerVaultFields.positions,
          addressBytes
        );
        const positionHex = await queryDictionaryState(
          stateRootHash,
          contractKey,
          "state",
          positionKey
        );
        if (positionHex) {
          position = parsePosition(positionHex);
        }
      }
    }

    return NextResponse.json({
      total_collateral,
      total_debt,
      params,
      paused,
      position,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to query vault" },
      { status: 500 }
    );
  }
}
