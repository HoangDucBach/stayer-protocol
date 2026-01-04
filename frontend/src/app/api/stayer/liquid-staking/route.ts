import { NextRequest, NextResponse } from "next/server";
import { LIQUID_STAKING_CONTRACT } from "@/configs/constants";
import {
  getStateRootHash,
  getActiveContractHash,
  queryDictionaryState,
  getOdraKey,
  parseOdraU64,
  parseOdraU512,
  parseWithdrawalRequest,
  LiquidStakingFields,
} from "@/libs/odra";

/**
 * GET /api/stayer/liquid-staking
 * Query params:
 *   - request_id: (optional) withdrawal request ID to fetch specific request
 *
 * Returns:
 *   - total_staked: Total CSPR staked in the pool
 *   - total_pending_withdrawal: Total pending withdrawals
 *   - next_request_id: Next withdrawal request ID
 *   - last_harvest_era: Last era rewards were harvested
 *   - cumulative_rewards: Total rewards accumulated
 *   - treasury_rewards: Protocol fee treasury
 *   - withdrawal_request: (if request_id provided) Specific withdrawal request
 */
export async function GET(request: NextRequest) {
  const requestId = request.nextUrl.searchParams.get("request_id");

  try {
    const stateRootHash = await getStateRootHash();
    const activeContractHash = await getActiveContractHash(
      stateRootHash,
      LIQUID_STAKING_CONTRACT
    );
    const contractKey = `hash-${activeContractHash}`;

    // Query total_staked (field index 7)
    const totalStakedKey = getOdraKey(LiquidStakingFields.total_staked);
    const totalStakedHex = await queryDictionaryState(
      stateRootHash,
      contractKey,
      "state",
      totalStakedKey
    );
    const total_staked = totalStakedHex ? parseOdraU512(totalStakedHex) : "0";

    // Query total_pending_withdrawal (field index 8)
    const pendingKey = getOdraKey(LiquidStakingFields.total_pending_withdrawal);
    const pendingHex = await queryDictionaryState(
      stateRootHash,
      contractKey,
      "state",
      pendingKey
    );
    const total_pending_withdrawal = pendingHex
      ? parseOdraU512(pendingHex)
      : "0";

    // Query next_request_id (field index 11)
    const nextIdKey = getOdraKey(LiquidStakingFields.next_request_id);
    const nextIdHex = await queryDictionaryState(
      stateRootHash,
      contractKey,
      "state",
      nextIdKey
    );
    const next_request_id = nextIdHex ? parseOdraU64(nextIdHex) : 1;

    // Query last_harvest_era (field index 12)
    const harvestEraKey = getOdraKey(LiquidStakingFields.last_harvest_era);
    const harvestEraHex = await queryDictionaryState(
      stateRootHash,
      contractKey,
      "state",
      harvestEraKey
    );
    const last_harvest_era = harvestEraHex ? parseOdraU64(harvestEraHex) : 0;

    // Query cumulative_rewards (field index 13)
    const rewardsKey = getOdraKey(LiquidStakingFields.cumulative_rewards);
    const rewardsHex = await queryDictionaryState(
      stateRootHash,
      contractKey,
      "state",
      rewardsKey
    );
    const cumulative_rewards = rewardsHex ? parseOdraU512(rewardsHex) : "0";

    // Query treasury_rewards (field index 14)
    const treasuryKey = getOdraKey(LiquidStakingFields.treasury_rewards);
    const treasuryHex = await queryDictionaryState(
      stateRootHash,
      contractKey,
      "state",
      treasuryKey
    );
    const treasury_rewards = treasuryHex ? parseOdraU512(treasuryHex) : "0";

    // Query specific withdrawal request if request_id provided
    let withdrawal_request = null;
    if (requestId) {
      const id = parseInt(requestId, 10);
      if (!isNaN(id)) {
        // Convert u64 to bytes (little-endian)
        const idBytes = Buffer.alloc(8);
        idBytes.writeBigUInt64LE(BigInt(id));
        const requestKey = getOdraKey(
          LiquidStakingFields.withdrawal_requests,
          idBytes
        );
        const requestHex = await queryDictionaryState(
          stateRootHash,
          contractKey,
          "state",
          requestKey
        );
        if (requestHex) {
          withdrawal_request = parseWithdrawalRequest(requestHex);
        }
      }
    }

    return NextResponse.json({
      total_staked,
      total_pending_withdrawal,
      next_request_id,
      last_harvest_era,
      cumulative_rewards,
      treasury_rewards,
      withdrawal_request,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to query liquid staking" },
      { status: 500 }
    );
  }
}
