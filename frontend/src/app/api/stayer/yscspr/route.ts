import { NextRequest, NextResponse } from "next/server";
import { YSCSPR_CONTRACT } from "@/configs/constants";
import {
  rpcRequest,
  getStateRootHash,
  getActiveContractHash,
  queryDictionaryState,
  getOdraKey,
  parseOdraU256,
  parseOdraBool,
} from "@/libs/odra";

// Based on the Rust struct: decimals(0), symbol(1), name(2), total_supply(3), balances(4)
const YSCSPRFields = {
  balances: 4, 
  authorized_minters: 6, // 0-5 are Cep18 fields
} as const;

function parseAddressToBytes(addressStr: string): Buffer | null {
  try {
    let tag = 0;
    let hex = "";

    if (addressStr.startsWith("account-hash-")) {
      tag = 0;
      hex = addressStr.replace("account-hash-", "");
    } else if (addressStr.startsWith("hash-")) {
      tag = 1;
      hex = addressStr.replace("hash-", "");
    } else if (addressStr.length === 64) {
      tag = 0; 
      hex = addressStr;
    } else {
      return null;
    }

    const hashBytes = Buffer.from(hex, "hex");
    if (hashBytes.length !== 32) return null;

    const buffer = Buffer.alloc(33);
    buffer[0] = tag;
    hashBytes.copy(buffer, 1);
    return buffer;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  const checkAuthorized = request.nextUrl.searchParams.get("check_authorized");

  try {
    const stateRootHash = await getStateRootHash();
    const activeContractHash = await getActiveContractHash(
      stateRootHash,
      YSCSPR_CONTRACT
    );
    
    const contractKey = activeContractHash.startsWith("hash-") 
      ? activeContractHash 
      : `hash-${activeContractHash}`;

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

    const name = (await queryNamedKey("name")) || "Yield Staked CSPR";
    const symbol = (await queryNamedKey("symbol")) || "ySCSPR";
    const decimals = (await queryNamedKey("decimals")) || 9;
    const total_supply = (await queryNamedKey("total_supply")) || "0";

    let balance = "0";
    if (address) {
      const addressBytes = parseAddressToBytes(address);
      
      if (addressBytes) {
        const balanceKey = getOdraKey(YSCSPRFields.balances, addressBytes);
        
        const balanceHex = await queryDictionaryState(
          stateRootHash,
          contractKey,
          "state", 
          balanceKey
        );

        if (balanceHex) {
          balance = parseOdraU256(balanceHex);
        }
      }
    }

    let is_authorized = false;
    if (checkAuthorized) {
        const addressBytes = parseAddressToBytes(checkAuthorized);
        if (addressBytes) {
            const authKey = getOdraKey(
                YSCSPRFields.authorized_minters,
                addressBytes
            );
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
      { error: error.message || "Failed to query ySCSPR token" },
      { status: 500 }
    );
  }
}