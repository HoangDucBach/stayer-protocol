import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  RpcClient,
  HttpHandler,
  PublicKey,
  PrivateKey,
  Args,
  KeyAlgorithm,
  ContractCallBuilder,
  CLValue,
} from 'casper-js-sdk';
import * as fs from 'fs';
import * as path from 'path';

export interface ValidatorInfo {
  publicKey: string;
  fee: number;
  isActive: boolean;
  totalStake: bigint;
  lastEraReward?: bigint; // Reward in most recent era
}

export interface PendingDelegation {
  validator: PublicKey;
  amount: bigint;
  era: number;
}

export interface PendingUndelegation {
  validator: PublicKey;
  amount: bigint;
  era: number;
}

export interface DelegatorInfo {
  validator: string;
  stakedAmount: bigint;
  bondingPurse: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

@Injectable()
export class CasperService {
  private readonly logger = new Logger(CasperService.name);
  private client: RpcClient;
  private privateKey: PrivateKey;
  private publicKey: PublicKey;

  constructor(private configService: ConfigService) {
    const nodeUrl = this.configService.get<string>('nodeUrl') || '';
    const rpcHandler = new HttpHandler(nodeUrl);
    this.client = new RpcClient(rpcHandler);

    const privateKeyPath = this.configService.get<string>(
      'keeperPrivateKeyPath',
    );
    if (privateKeyPath) {
      const absolutePath = path.resolve(privateKeyPath);
      if (!fs.existsSync(absolutePath)) {
        throw new Error(`Private key file not found at: ${absolutePath}`);
      }

      const privateKeyPem = fs.readFileSync(absolutePath, 'utf8');
      // Auto-detect key algorithm from PEM content
      const algorithm = privateKeyPem.includes('EC PRIVATE KEY')
        ? KeyAlgorithm.SECP256K1
        : KeyAlgorithm.ED25519;
      this.privateKey = PrivateKey.fromPem(privateKeyPem, algorithm);
      this.publicKey = this.privateKey.publicKey;

      this.logger.log(`Loaded keeper private key from: ${privateKeyPath}`);
    }
  }

  async getCurrentEra(): Promise<number> {
    const status = await this.client.getStatus();
    return status.lastAddedBlockInfo?.eraID ?? 0;
  }

  async getValidators(): Promise<ValidatorInfo[]> {
    try {
      const auctionInfo = await this.client.getLatestAuctionInfo();
      const validators: ValidatorInfo[] = [];

      for (const bid of auctionInfo.auctionState.bids) {
        const publicKey = bid.publicKey.toHex();
        const bidData = bid.bid.unified || bid.bid.validator;

        if (bidData) {
          const delegationRate = bidData.delegationRate;
          const inactive = bidData.inactive || false;
          const stakedAmount = BigInt(bidData.stakedAmount.toString());

          validators.push({
            publicKey,
            fee: delegationRate,
            isActive: !inactive,
            totalStake: stakedAmount,
          });
        }
      }

      return validators;
    } catch (error) {
      this.logger.error(
        `Failed to fetch validators: ${getErrorMessage(error)}`,
      );
      return [];
    }
  }

  async sendDeploy(
    contractPackageHash: string,
    entryPoint: string,
    args: Args,
    paymentAmount: string = '5000000000',
  ): Promise<string> {
    const chainName =
      this.configService.get<string>('chainName') || 'casper-test';

    this.logger.debug(
      `Sending transaction: packageHash=${contractPackageHash}, entryPoint=${entryPoint}, args count=${args.args.size}`,
    );

    // Debug: Log args details
    const argsArray = Array.from(args.args.entries());
    this.logger.debug(
      `Args details: ${JSON.stringify(argsArray.map(([k, v]) => [k, v.getType()]))}`,
    );

    const transaction = new ContractCallBuilder()
      .from(this.publicKey)
      .byPackageHash(contractPackageHash)
      .entryPoint(entryPoint)
      .runtimeArgs(args)
      .chainName(chainName)
      .payment(parseInt(paymentAmount, 10))
      .build(); // Use legacy format for Casper 1.x networks

    this.logger.debug(`Transaction built successfully, signing...`);
    transaction.sign(this.privateKey);

    this.logger.debug(`Transaction signed, sending to network...`);
    const result = await this.client.putTransaction(transaction);

    this.logger.log(`Transaction sent: ${result.transactionHash.toHex()}`);
    return result.transactionHash.toHex();
  }

  async waitForDeploy(
    transactionHash: string,
    timeout: number = 180000,
  ): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const transactionResult =
          await this.client.getTransactionByTransactionHash(transactionHash);

        if (transactionResult && transactionResult.executionInfo) {
          const execResult = transactionResult.executionInfo.executionResult;
          if (!execResult.errorMessage) {
            this.logger.log(`Transaction ${transactionHash} succeeded`);
            return true;
          } else {
            this.logger.error(
              `Transaction ${transactionHash} failed: ${execResult.errorMessage}`,
            );
            return false;
          }
        }
      } catch (error) {
        this.logger.warn(
          `Waiting for transaction ${transactionHash}: ${getErrorMessage(error)}`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    this.logger.error(`Transaction ${transactionHash} timeout`);
    return false;
  }

  /**
   * Get delegator info for keeper account
   * Returns total delegation amount across all validators
   *
   * NOTE: casper-js-sdk v5.x has different API than v2.x
   * This needs to be implemented based on actual SDK documentation
   */
  async getTotalDelegation(): Promise<bigint> {
    try {
      const auctionInfo = await this.client.getLatestAuctionInfo();
      const keeperPublicKeyHex = this.publicKey.toHex();

      let totalDelegation = BigInt(0);

      // Search through all bids to find delegations from keeper
      for (const bid of auctionInfo.auctionState.bids) {
        const bidData = bid.bid.unified || bid.bid.validator;

        if (bidData) {
          // Check if bidData has delegators property
          const delegators = (bidData as any).delegators;
          if (Array.isArray(delegators)) {
            for (const delegator of delegators) {
              try {
                const delegatorKey =
                  delegator.publicKey?.toHex?.() || delegator.publicKey;
                if (delegatorKey === keeperPublicKeyHex) {
                  const stakedAmount = BigInt(
                    delegator.stakedAmount?.toString() || '0',
                  );
                  totalDelegation += stakedAmount;
                  this.logger.debug(
                    `Found delegation to ${bid.publicKey.toHex()}: ${stakedAmount}`,
                  );
                }
              } catch (err) {
                // Skip invalid delegator entries
                continue;
              }
            }
          }
        }
      }

      this.logger.log(`Total delegation: ${totalDelegation} motes`);
      return totalDelegation;
    } catch (error) {
      this.logger.error(
        `Failed to get total delegation: ${getErrorMessage(error)}`,
      );
      return BigInt(0);
    }
  }

  /**
   * Delegate CSPR to a validator via auction system contract
   * Min amount: 500 CSPR (500_000_000_000 motes)
   * Fixed cost: 2.5 CSPR (2_500_000_000 motes)
   */
  async delegate(validatorPublicKey: string, amount: string): Promise<string> {
    try {
      const auctionHash =
        this.configService.get<string>('auctionContractHash') || '';

      if (!auctionHash) {
        throw new Error('Auction contract hash not configured');
      }

      const validator = PublicKey.fromHex(validatorPublicKey);

      const args = Args.fromMap({
        delegator: CLValue.newCLPublicKey(this.publicKey),
        validator: CLValue.newCLPublicKey(validator),
        amount: CLValue.newCLUInt512(amount),
      });

      this.logger.log(
        `Delegating ${amount} motes to validator ${validatorPublicKey}`,
      );

      const deployHash = await this.sendDeploy(
        `hash-${auctionHash}`,
        'delegate',
        args,
        '2500000000', // 2.5 CSPR fixed cost
      );

      this.logger.log(`Delegation transaction sent: ${deployHash}`);
      return deployHash;
    } catch (error) {
      this.logger.error(`Failed to delegate: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  /**
   * Undelegate CSPR from a validator via auction system contract
   * Fixed cost: 2.5 CSPR (2_500_000_000 motes)
   * Unbonding period: 7 eras (~14 hours on mainnet)
   */
  async undelegate(
    validatorPublicKey: string,
    amount: string,
  ): Promise<string> {
    try {
      const auctionHash =
        this.configService.get<string>('auctionContractHash') || '';

      if (!auctionHash) {
        throw new Error('Auction contract hash not configured');
      }

      const validator = PublicKey.fromHex(validatorPublicKey);

      const args = Args.fromMap({
        delegator: CLValue.newCLPublicKey(this.publicKey),
        validator: CLValue.newCLPublicKey(validator),
        amount: CLValue.newCLUInt512(amount),
      });

      this.logger.log(
        `Undelegating ${amount} motes from validator ${validatorPublicKey}`,
      );

      const deployHash = await this.sendDeploy(
        `hash-${auctionHash}`,
        'undelegate',
        args,
        '2500000000', // 2.5 CSPR fixed cost
      );

      this.logger.log(`Undelegation transaction sent: ${deployHash}`);
      return deployHash;
    } catch (error) {
      this.logger.error(`Failed to undelegate: ${getErrorMessage(error)}`);
      throw error;
    }
  }
}
