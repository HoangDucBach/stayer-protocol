import { NextRequest, NextResponse } from "next/server";
import {
  CASPER_NODE_ADDRESS,
  VALIDATOR_REGISTRY_CONTRACT,
} from "@/configs/constants";
import { blake2bHex } from "blakejs";
import { getActiveContractHash, getStateRootHash } from "@/libs/odra";

const RPC_URL = CASPER_NODE_ADDRESS;

function getOdraMappingKey(index: number, keyBytes: Uint8Array): string {
  const buffer = new Uint8Array(4 + keyBytes.length);
  const view = new DataView(buffer.buffer);
  view.setUint32(0, index, false);
  buffer.set(keyBytes, 4);
  return blake2bHex(buffer, undefined, 32);
}

function parseValidatorData(hex: string) {
  try {
    let cursor = 0;
    if (hex.length > 66) cursor = 8;

    const buf = Buffer.from(hex, "hex");

    const readU64 = () => {
      const val = Number(buf.readBigUInt64LE(cursor / 2));
      cursor += 16;
      return val;
    };
    const readBool = () => {
      const val = buf[cursor / 2] !== 0;
      cursor += 2;
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

async function rpcRequest(method: string, params: any) {
  try {
    const response = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: Date.now(), jsonrpc: "2.0", method, params }),
      cache: "no-store",
    });
    const json = await response.json();
    if (json.error) return null;
    return json.result;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { pubkey: string } }
) {
  const pubkey = params.pubkey;
  if (!pubkey)
    return NextResponse.json({ error: "Missing pubkey" }, { status: 400 });
  const stateRootHash = await getStateRootHash();
  const activeContractHash = await getActiveContractHash(
    stateRootHash,
    VALIDATOR_REGISTRY_CONTRACT
  );

  try {
    const rootRes = await rpcRequest("chain_get_state_root_hash", []);
    if (!rootRes)
      return NextResponse.json({ error: "Network Error" }, { status: 500 });
    const stateRootHash = rootRes.state_root_hash;

    const contractKey = `hash-${activeContractHash}`;

    const pubKeyBytes = Buffer.from(pubkey, "hex");

    let foundData = null;

    for (let i = 0; i < 10; i++) {
      const tryKey = getOdraMappingKey(i, pubKeyBytes);

      const res = await rpcRequest("state_get_dictionary_item", {
        state_root_hash: stateRootHash,
        dictionary_identifier: {
          ContractNamedKey: {
            key: contractKey,
            dictionary_name: "state",
            dictionary_item_key: tryKey,
          },
        },
      });

      const hex =
        res?.stored_value?.CLValue?.bytes || res?.stored_value?.CLValue?.parsed;

      if (hex) {
        foundData = parseValidatorData(hex);
        break;
      }
    }

    return NextResponse.json(foundData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
