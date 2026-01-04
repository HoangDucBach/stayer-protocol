/**
 * Odra Proxy Caller Utility for casper-js-sdk v5
 *
 * This utility enables calling Odra payable functions by using proxy_caller.wasm
 * Reference: https://github.com/odradev/odra/tree/release/2.5.0/odra-casper/proxy-caller
 */

import {
  Args,
  CLValue,
  CLTypeUInt8,
  PublicKey,
  SessionBuilder,
  TransactionWrapper,
  Key,
  ContractPackageHash,
} from "casper-js-sdk";
import { CASPER_CHAIN_NAME } from "@/configs/constants";

const PROXY_WASM_PATH = "/wasm/proxy_caller.wasm";

// Cache for WASM buffer
let proxyWasmCache: Uint8Array | null = null;

/**
 * Load proxy_caller.wasm from public folder
 */
async function loadProxyWasm(): Promise<Uint8Array> {
  if (proxyWasmCache) {
    return proxyWasmCache;
  }

  const response = await fetch(PROXY_WASM_PATH);
  if (!response.ok) {
    throw new Error(`Failed to load proxy_caller.wasm: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  proxyWasmCache = new Uint8Array(buffer);
  return proxyWasmCache;
}

/**
 * Serialize Args to CLList<CLU8> format required by Odra proxy
 */
function serializeArgsToList(args: Args): CLValue {
  const argsBytes = args.toBytes();
  const u8Values = Array.from(argsBytes).map((byte) =>
    CLValue.newCLUint8(byte)
  );
  return CLValue.newCLList(CLTypeUInt8, u8Values);
}

export interface OdraProxyCallParams {
  /** Sender's public key */
  senderPublicKey: PublicKey;
  /** Contract package hash (with or without 'hash-' prefix) */
  packageHash: string;
  /** Entry point name to call */
  entryPoint: string;
  /** Inner arguments for the contract function */
  innerArgs: Args;
  /** Amount to attach (in motes) for payable functions */
  attachedValue: string;
  /** Gas payment amount (default: 10 CSPR) */
  paymentAmount?: number;
}

/**
 * Build a transaction that calls an Odra contract via proxy_caller.wasm
 * This is required for #[odra(payable)] functions
 */
export async function buildOdraProxyTransaction({
  senderPublicKey,
  packageHash,
  entryPoint,
  innerArgs,
  attachedValue,
  paymentAmount = 10_000_000_000, // 10 CSPR default
}: OdraProxyCallParams): Promise<object> {
  // Load WASM
  const wasmBytes = await loadProxyWasm();

  // Serialize inner args to CLList<CLU8>
  const serializedArgs = serializeArgsToList(innerArgs);

  // Build proxy args
  const proxyArgs = Args.fromMap({
    package_hash: CLValue.newCLByteArray(ContractPackageHash.newContractPackage(packageHash).hash.toBytes()),
    entry_point: CLValue.newCLString(entryPoint),
    args: serializedArgs,
    attached_value: CLValue.newCLUInt512(attachedValue),
    amount: CLValue.newCLUInt512(attachedValue),
  });

  // Build session transaction with WASM
  const transaction = new SessionBuilder()
    .from(senderPublicKey)
    .wasm(wasmBytes)
    .runtimeArgs(proxyArgs)
    .chainName(CASPER_CHAIN_NAME)
    .payment(paymentAmount)
    .build();

  // Wrap for cspr.click
  const wrapper = transaction.getTransactionWrapper();
  return TransactionWrapper.toJSON(wrapper) as object;
}

/**
 * Build inner args for stake function
 */
export function buildStakeInnerArgs(
  validatorPublicKey: string,
  currentEra: number
): Args {
  return Args.fromMap({
    validator_pubkey: CLValue.newCLPublicKey(
      PublicKey.fromHex(validatorPublicKey)
    ),
    current_era: CLValue.newCLUint64(currentEra),
  });
}

/**
 * Build inner args for unstake function
 */
export function buildUnstakeInnerArgs(
  validatorPublicKey: string,
  yscsprAmount: string,
  currentEra: number
): Args {
  return Args.fromMap({
    validator_pubkey: CLValue.newCLPublicKey(
      PublicKey.fromHex(validatorPublicKey)
    ),
    yscspr_amount: CLValue.newCLUInt256(yscsprAmount),
    current_era: CLValue.newCLUint64(currentEra),
  });
}

/**
 * Build inner args for claim function
 */
export function buildClaimInnerArgs(currentEra: number): Args {
  return Args.fromMap({
    current_era: CLValue.newCLUint64(currentEra),
  });
}

/**
 * Build inner args for vault deposit (empty - amount sent via attached_value)
 */
export function buildDepositInnerArgs(): Args {
  return Args.fromMap({});
}

/**
 * Build inner args for borrow function
 */
export function buildBorrowInnerArgs(cusdAmount: string): Args {
  return Args.fromMap({
    cusd_amount: CLValue.newCLUInt256(cusdAmount),
  });
}

/**
 * Build inner args for repay function
 */
export function buildRepayInnerArgs(cusdAmount: string): Args {
  return Args.fromMap({
    cusd_amount: CLValue.newCLUInt256(cusdAmount),
  });
}

/**
 * Build inner args for withdraw function
 */
export function buildWithdrawInnerArgs(yscsprAmount: string): Args {
  return Args.fromMap({
    yscspr_amount: CLValue.newCLUInt256(yscsprAmount),
  });
}

/**
 * Build inner args for liquidate function
 */
export function buildLiquidateInnerArgs(userAddress: string, debtToCover: string): Args {
  return Args.fromMap({
    user: CLValue.newCLByteArray(Buffer.from(userAddress, "hex")),
    debt_to_cover: CLValue.newCLUInt256(debtToCover),
  });
}

/**
 * Build inner args for transfer function (ERC20-like)
 */
export function buildTransferInnerArgs(recipient: string, amount: string): Args {
  return Args.fromMap({
    recipient: CLValue.newCLByteArray(Buffer.from(recipient, "hex")),
    amount: CLValue.newCLUInt256(amount),
  });
}

/**
 * Build inner args for approve function (ERC20-like)
 */
export function buildApproveInnerArgs(spender: string, amount: string): Args {
  return Args.fromMap({
    spender: CLValue.newCLByteArray(Buffer.from(spender, "hex")),
    amount: CLValue.newCLUInt256(amount),
  });
}
