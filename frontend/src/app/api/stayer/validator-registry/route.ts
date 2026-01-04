import { NextRequest, NextResponse } from "next/server";
import { VALIDATOR_REGISTRY_CONTRACT } from "@/configs/constants";
import {
  getStateRootHash,
  getActiveContractHash,
  queryDictionaryState,
  getOdraKey,
  parseOdraU64,
  parseValidatorData,
  ValidatorRegistryFields,
} from "@/libs/odra";

/**
 * GET /api/stayer/validator-registry
 * Query params:
 *   - pubkey: (optional) validator public key hex to fetch specific validator data
 *
 * Returns:
 *   - network_p_avg: Network P average from contract
 *   - last_update_era: Last update era from contract
 *   - validator: (if pubkey provided) Validator data from registry
 */
export async function GET(request: NextRequest) {
  const pubkey = request.nextUrl.searchParams.get("pubkey");

  try {
    const stateRootHash = await getStateRootHash();
    const activeContractHash = await getActiveContractHash(
      stateRootHash,
      VALIDATOR_REGISTRY_CONTRACT
    );
    const contractKey = `hash-${activeContractHash}`;

    // Query network_p_avg (field index 1)
    const pAvgKey = getOdraKey(ValidatorRegistryFields.network_p_avg);
    const pAvgHex = await queryDictionaryState(
      stateRootHash,
      contractKey,
      "state",
      pAvgKey
    );
    const network_p_avg = pAvgHex ? parseOdraU64(pAvgHex) : null;

    // Query last_update_era (field index 2)
    const eraKey = getOdraKey(ValidatorRegistryFields.last_update_era);
    const eraHex = await queryDictionaryState(
      stateRootHash,
      contractKey,
      "state",
      eraKey
    );
    const last_update_era = eraHex ? parseOdraU64(eraHex) : null;

    // Query specific validator if pubkey provided
    let validator = null;
    if (pubkey) {
      const pubKeyBytes = Buffer.from(pubkey, "hex");
      const mapKey = getOdraKey(
        ValidatorRegistryFields.validators,
        pubKeyBytes
      );
      const mapHex = await queryDictionaryState(
        stateRootHash,
        contractKey,
        "state",
        mapKey
      );

      if (mapHex) {
        validator = parseValidatorData(mapHex);
      }
    }

    return NextResponse.json({
      network_p_avg,
      last_update_era,
      validator,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to query validator registry" },
      { status: 500 }
    );
  }
}
