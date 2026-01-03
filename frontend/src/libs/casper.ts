import { CASPER_NODE_ADDRESS } from "@/configs/constants";
import { HttpHandler, RpcClient } from "casper-js-sdk";

const rpcHandler = new HttpHandler(CASPER_NODE_ADDRESS);
rpcHandler.setCustomHeaders({
  Authorization: process.env.CASPER_API_KEY!,
});

export const rpcClient = new RpcClient(rpcHandler);

export type DeployResult = {
  deployHash: string;
  executionResult: {
    success: boolean;
    errorMessage?: string;
    cost?: string;
  };
  blockHash?: string;
};

export type TransactionResult = {
  transactionHash: string;
  executionResult: {
    success: boolean;
    errorMessage?: string;
    cost?: string;
  };
  blockHash?: string;
};

/**
 * Wait for a deploy to be executed and return the result
 * @param deployHash The deploy hash to wait for
 * @param timeoutMs Maximum time to wait (default: 5 minutes)
 * @param pollIntervalMs Polling interval (default: 2 seconds)
 */
export async function waitForDeploy(
  deployHash: string,
  timeoutMs = 300000,
  pollIntervalMs = 2000
): Promise<DeployResult> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const result = await rpcClient.getDeploy(deployHash);

      if (result.executionInfo) {
        const executionResult = result.executionInfo.executionResult;

        // Check if execution completed
        if (executionResult) {
          // In v5, success = no errorMessage
          const isSuccess = !executionResult.errorMessage;

          return {
            deployHash,
            executionResult: {
              success: isSuccess,
              errorMessage: executionResult.errorMessage,
              cost: executionResult.cost?.toString(),
            },
            blockHash: result.executionInfo.blockHash?.toHex(),
          };
        }
      }
    } catch {
      // Deploy not found yet, continue polling
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Timeout waiting for deploy ${deployHash}`);
}

/**
 * Wait for a transaction to be executed and return the result
 * @param transactionHash The transaction hash to wait for
 * @param timeoutMs Maximum time to wait (default: 5 minutes)
 * @param pollIntervalMs Polling interval (default: 2 seconds)
 */
export async function waitForTransaction(
  transactionHash: string,
  timeoutMs = 300000,
  pollIntervalMs = 2000
): Promise<TransactionResult> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const result =
        await rpcClient.getTransactionByTransactionHash(transactionHash);

      if (result.executionInfo) {
        const executionResult = result.executionInfo.executionResult;

        // Check if execution completed
        if (executionResult) {
          // In v5, success = no errorMessage
          const isSuccess = !executionResult.errorMessage;

          return {
            transactionHash,
            executionResult: {
              success: isSuccess,
              errorMessage: executionResult.errorMessage,
              cost: executionResult.cost?.toString(),
            },
            blockHash: result.executionInfo.blockHash?.toHex(),
          };
        }
      }
    } catch {
      // Transaction not found yet, continue polling
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Timeout waiting for transaction ${transactionHash}`);
}

/**
 * Wait for a deploy or transaction hash
 * Automatically detects if it's a deploy hash or transaction hash
 */
export async function waitForDeployOrTransaction(
  hash: string,
  timeoutMs = 300000,
  pollIntervalMs = 2000
): Promise<DeployResult | TransactionResult> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    // Try deploy first
    try {
      const deployResult = await rpcClient.getDeploy(hash);
      if (deployResult.executionInfo?.executionResult) {
        const executionResult = deployResult.executionInfo.executionResult;
        const isSuccess = !executionResult.errorMessage;

        return {
          deployHash: hash,
          executionResult: {
            success: isSuccess,
            errorMessage: executionResult.errorMessage,
            cost: executionResult.cost?.toString(),
          },
          blockHash: deployResult.executionInfo.blockHash?.toHex(),
        };
      }
    } catch {
      // Not a deploy, try transaction
    }

    // Try transaction
    try {
      const txResult = await rpcClient.getTransactionByTransactionHash(hash);
      if (txResult.executionInfo?.executionResult) {
        const executionResult = txResult.executionInfo.executionResult;
        const isSuccess = !executionResult.errorMessage;

        return {
          transactionHash: hash,
          executionResult: {
            success: isSuccess,
            errorMessage: executionResult.errorMessage,
            cost: executionResult.cost?.toString(),
          },
          blockHash: txResult.executionInfo.blockHash?.toHex(),
        };
      }
    } catch {
      // Transaction not found yet
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Timeout waiting for deploy/transaction ${hash}`);
}
