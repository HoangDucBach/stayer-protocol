import { NextRequest, NextResponse } from "next/server";
import { CUSD_CONTRACT } from "@/configs/constants";
import {
  rpcRequest,
  getStateRootHash,
  getActiveContractHash,
  queryDictionaryState,
  getOdraKey,
  parseOdraU256,
  parseOdraBool,
} from "@/libs/odra";

// CEP-18 SubModule storage indices within the parent contract
// SubModule fields are stored with a prefix based on parent field index
const CUSDFields = {
  // SubModule<Cep18> at index 0 - CEP-18 fields are nested
  // Standard CEP-18 named keys we can query
  authorized_minters: 1, // Mapping<Address, bool>
  owner: 2, // Var<Address>
} as const;

/**
 * GET /api/stayer/cusd
 * Query params:
 *   - address: (optional) address to check balance
 *   - check_authorized: (optional) address to check if authorized minter
 *
 * Returns:
 *   - name: Token name
 *   - symbol: Token symbol
 *   - decimals: Token decimals
 *   - total_supply: Total supply
 *   - balance: (if address provided) Balance of address
 *   - is_authorized: (if check_authorized provided) Whether address is authorized
 */
export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  const checkAuthorized = request.nextUrl.searchParams.get("check_authorized");

  try {
    const stateRootHash = await getStateRootHash();
    const activeContractHash = await getActiveContractHash(
      stateRootHash,
      CUSD_CONTRACT
    );
    const contractKey = `hash-${activeContractHash}`;

    // Query CEP-18 standard named keys for token metadata
    const queryNamedKey = async (key: string) => {
      try {
        const res = await rpcRequest("state_get_item", {
          state_root_hash: stateRootHash,
          key: contractKey,
          path: [key],
        });
        return res.stored_value?.CLValue?.parsed;
      } catch {
        return null;
      }
    };

    // Get token metadata from CEP-18 named keys
    const name = (await queryNamedKey("name")) || "Casper USD";
    const symbol = (await queryNamedKey("symbol")) || "cUSD";
    const decimals = (await queryNamedKey("decimals")) || 9;
    const total_supply = (await queryNamedKey("total_supply")) || "0";

    // Query balance if address provided
    let balance = null;
    if (address) {
      try {
        // CEP-18 balances are stored in "balances" dictionary
        const res = await rpcRequest("state_get_dictionary_item", {
          state_root_hash: stateRootHash,
          dictionary_identifier: {
            ContractNamedKey: {
              key: contractKey,
              dictionary_name: "balances",
              dictionary_item_key: address,
            },
          },
        });
        const balanceHex = res.stored_value?.CLValue?.bytes;
        balance = balanceHex ? parseOdraU256(balanceHex) : "0";
      } catch {
        balance = "0";
      }
    }

    // Query authorized status if check_authorized provided
    let is_authorized = null;
    if (checkAuthorized) {
      // Extract hash from address format
      const hashMatch = checkAuthorized.match(
        /(?:account-hash-|hash-)([a-fA-F0-9]+)/
      );
      if (hashMatch) {
        const addressBytes = Buffer.alloc(33);
        addressBytes[0] = checkAuthorized.startsWith("account-hash-") ? 0 : 1;
        Buffer.from(hashMatch[1], "hex").copy(addressBytes, 1);

        const authKey = getOdraKey(CUSDFields.authorized_minters, addressBytes);
        const authHex = await queryDictionaryState(
          stateRootHash,
          contractKey,
          "state",
          authKey
        );
        is_authorized = authHex ? parseOdraBool(authHex) : false;
      }
    }

    return NextResponse.json({
      name,
      symbol,
      decimals,
      total_supply,
      balance,
      is_authorized,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to query cUSD token" },
      { status: 500 }
    );
  }
}
