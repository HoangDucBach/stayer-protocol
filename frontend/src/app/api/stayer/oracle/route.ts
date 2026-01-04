import { NextRequest, NextResponse } from "next/server";
import { PRICE_ORACLE_CONTRACT } from "@/configs/constants";
import {
  getStateRootHash,
  getActiveContractHash,
  queryDictionaryState,
  getOdraKey,
  parseOdraU64,
  parseOdraU256,
  parseOdraBool,
  parsePriceData,
  PriceOracleFields,
} from "@/libs/odra";

/**
 * GET /api/stayer/oracle
 *
 * Returns:
 *   - price_data: { price, updated_at, round_id }
 *   - max_age: Maximum acceptable data age in seconds
 *   - fallback_price: Emergency fallback price
 *   - use_fallback: Whether fallback mode is enabled
 */
export async function GET(request: NextRequest) {
  try {
    const stateRootHash = await getStateRootHash();
    const activeContractHash = await getActiveContractHash(
      stateRootHash,
      PRICE_ORACLE_CONTRACT
    );
    const contractKey = `hash-${activeContractHash}`;

    // Query price_data (field index 0)
    const priceDataKey = getOdraKey(PriceOracleFields.price_data);
    const priceDataHex = await queryDictionaryState(
      stateRootHash,
      contractKey,
      "state",
      priceDataKey
    );
    const price_data = priceDataHex ? parsePriceData(priceDataHex) : null;

    // Query max_age (field index 1)
    const maxAgeKey = getOdraKey(PriceOracleFields.max_age);
    const maxAgeHex = await queryDictionaryState(
      stateRootHash,
      contractKey,
      "state",
      maxAgeKey
    );
    const max_age = maxAgeHex ? parseOdraU64(maxAgeHex) : null;

    // Query fallback_price (field index 5)
    const fallbackPriceKey = getOdraKey(PriceOracleFields.fallback_price);
    const fallbackPriceHex = await queryDictionaryState(
      stateRootHash,
      contractKey,
      "state",
      fallbackPriceKey
    );
    const fallback_price = fallbackPriceHex
      ? parseOdraU256(fallbackPriceHex)
      : null;

    // Query use_fallback (field index 6)
    const useFallbackKey = getOdraKey(PriceOracleFields.use_fallback);
    const useFallbackHex = await queryDictionaryState(
      stateRootHash,
      contractKey,
      "state",
      useFallbackKey
    );
    const use_fallback = useFallbackHex
      ? parseOdraBool(useFallbackHex)
      : false;

    return NextResponse.json({
      price_data,
      max_age,
      fallback_price,
      use_fallback,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to query price oracle" },
      { status: 500 }
    );
  }
}
