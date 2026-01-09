import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CasperService } from '../casper/casper.service';
import {
  CLValue,
  Args,
  PublicKey,
  ContractCallBuilder,
  PrivateKey,
  RpcClient,
  HttpHandler,
  KeyAlgorithm,
} from 'casper-js-sdk';
import * as fs from 'fs';
import * as path from 'path';

interface PendingDelegation {
  validator: string;
  amount: bigint;
  era: number;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) return error.stack;
  return undefined;
}

// Minimum delegation on Casper is 500 CSPR
const MIN_DELEGATION_AMOUNT = BigInt(500_000_000_000);
const DELEGATION_GAS = '2500000000'; // 2.5 CSPR

@Injectable()
export class DelegationService {
  private readonly logger = new Logger(DelegationService.name);
  private client: RpcClient;
  private privateKey: PrivateKey;
  private publicKey: PublicKey;
  private readonly auctionContractHash: string;

  constructor(
    private casperService: CasperService,
    private configService: ConfigService,
  ) {
    const nodeUrl = this.configService.get<string>('nodeUrl') || '';
    const rpcHandler = new HttpHandler(nodeUrl);
    this.client = new RpcClient(rpcHandler);

    // Auction contract hash for testnet
    this.auctionContractHash =
      this.configService.get<string>('auctionContractHash') ||
      'hash-93d923e336b20a4c4ca14d592b60e5bd3fe330775618290104f9beb326db7ae2';

    // Load keeper private key
    const privateKeyPath = this.configService.get<string>(
      'keeperPrivateKeyPath',
    );
    if (privateKeyPath) {
      const absolutePath = path.resolve(privateKeyPath);
      if (fs.existsSync(absolutePath)) {
        const privateKeyPem = fs.readFileSync(absolutePath, 'utf8');
        const algorithm = privateKeyPem.includes('EC PRIVATE KEY')
          ? KeyAlgorithm.SECP256K1
          : KeyAlgorithm.ED25519;
        this.privateKey = PrivateKey.fromPem(privateKeyPem, algorithm);
        this.publicKey = this.privateKey.publicKey;
        this.logger.log(`Delegation service initialized with keeper key`);
      }
    }
  }

  /**
   * Process all pending delegations from the liquid staking contract
   */
  async processDelegations(): Promise<void> {
    try {
      this.logger.log('Starting delegation processing...');

      // Step 1: Get pending delegations from contract
      const pendingDelegations = await this.getPendingDelegations();

      if (pendingDelegations.length === 0) {
        this.logger.log('No pending delegations to process');
        return;
      }

      this.logger.log(`Found ${pendingDelegations.length} pending delegations`);

      // Step 2: Process each pending delegation
      for (const delegation of pendingDelegations) {
        if (delegation.amount < MIN_DELEGATION_AMOUNT) {
          this.logger.warn(
            `Skipping delegation to ${delegation.validator}: amount ${delegation.amount} below minimum ${MIN_DELEGATION_AMOUNT}`,
          );
          continue;
        }

        try {
          await this.processSingleDelegation(delegation);
        } catch (error) {
          this.logger.error(
            `Failed to process delegation to ${delegation.validator}: ${getErrorMessage(error)}`,
            getErrorStack(error),
          );
          // Continue with other delegations
        }
      }

      this.logger.log('Delegation processing completed');
    } catch (error) {
      this.logger.error(
        `Delegation processing failed: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
    }
  }

  /**
   * Get pending delegations from the liquid staking contract
   * Note: This queries the contract's get_pending_delegations entry point
   */
  private async getPendingDelegations(): Promise<PendingDelegation[]> {
    const contractHash =
      this.configService.get<string>('liquidStakingContractPackageHash') || '';

    try {
      // Call the contract's get_pending_delegations entry point
      const args = Args.fromMap({});

      const deployHash = await this.casperService.sendDeploy(
        contractHash,
        'get_pending_delegations',
        args,
        '1000000000', // 1 CSPR gas for read operation
      );

      // Wait for the deploy and parse results
      // In practice, you'd use a view function or query the contract state directly
      // For now, return empty and log - this will be populated when events are emitted
      this.logger.log(`Queried pending delegations: ${deployHash}`);

      // TODO: Parse the result from contract state or events
      // For MVP, rely on events emitted during stake() and track in keeper DB
      return [];
    } catch (error) {
      this.logger.warn(
        `Could not query pending delegations: ${getErrorMessage(error)}`,
      );
      return [];
    }
  }

  /**
   * Process a single delegation
   */
  private async processSingleDelegation(
    delegation: PendingDelegation,
  ): Promise<void> {
    this.logger.log(
      `Processing delegation to ${delegation.validator}: ${delegation.amount} motes`,
    );

    // Step 1: Withdraw CSPR from liquid staking contract
    const withdrawHash = await this.withdrawForDelegation(
      delegation.validator,
      delegation.amount,
    );

    const withdrawSuccess =
      await this.casperService.waitForDeploy(withdrawHash);
    if (!withdrawSuccess) {
      throw new Error(`Withdraw for delegation failed: ${withdrawHash}`);
    }

    this.logger.log(`Withdraw successful: ${withdrawHash}`);

    // Step 2: Delegate to validator via auction contract
    const delegateHash = await this.delegateToValidator(
      delegation.validator,
      delegation.amount,
    );

    const delegateSuccess =
      await this.casperService.waitForDeploy(delegateHash);
    if (!delegateSuccess) {
      throw new Error(`Delegation to validator failed: ${delegateHash}`);
    }

    this.logger.log(`Delegation successful: ${delegateHash}`);

    // Step 3: Confirm delegation in liquid staking contract
    const confirmHash = await this.confirmDelegation(
      delegation.validator,
      delegation.amount,
    );

    const confirmSuccess = await this.casperService.waitForDeploy(confirmHash);
    if (!confirmSuccess) {
      throw new Error(`Confirm delegation failed: ${confirmHash}`);
    }

    this.logger.log(
      `Delegation confirmed for ${delegation.validator}: ${confirmHash}`,
    );
  }

  /**
   * Call liquid staking contract to withdraw CSPR for delegation
   */
  private async withdrawForDelegation(
    validatorPubKey: string,
    amount: bigint,
  ): Promise<string> {
    const contractHash =
      this.configService.get<string>('liquidStakingContractPackageHash') || '';

    const args = Args.fromMap({
      validator: CLValue.newCLPublicKey(PublicKey.fromHex(validatorPubKey)),
      amount: CLValue.newCLUInt512(amount.toString()),
    });

    return this.casperService.sendDeploy(
      contractHash,
      'withdraw_for_delegation',
      args,
      '5000000000', // 5 CSPR gas
    );
  }

  /**
   * Delegate CSPR to validator via auction contract
   */
  private async delegateToValidator(
    validatorPubKey: string,
    amount: bigint,
  ): Promise<string> {
    const chainName =
      this.configService.get<string>('chainName') || 'casper-test';

    const args = Args.fromMap({
      delegator: CLValue.newCLPublicKey(this.publicKey),
      validator: CLValue.newCLPublicKey(PublicKey.fromHex(validatorPubKey)),
      amount: CLValue.newCLUInt512(amount.toString()),
    });

    // Build transaction to auction contract
    const transaction = new ContractCallBuilder()
      .from(this.publicKey)
      .byHash(this.auctionContractHash.replace('hash-', ''))
      .entryPoint('delegate')
      .runtimeArgs(args)
      .chainName(chainName)
      .payment(parseInt(DELEGATION_GAS, 10))
      .build();

    transaction.sign(this.privateKey);

    const result = await this.client.putTransaction(transaction);
    this.logger.log(
      `Delegate transaction sent: ${result.transactionHash.toHex()}`,
    );

    return result.transactionHash.toHex();
  }

  /**
   * Confirm delegation in liquid staking contract
   */
  private async confirmDelegation(
    validatorPubKey: string,
    amount: bigint,
  ): Promise<string> {
    const contractHash =
      this.configService.get<string>('liquidStakingContractPackageHash') || '';

    const args = Args.fromMap({
      validator: CLValue.newCLPublicKey(PublicKey.fromHex(validatorPubKey)),
      amount: CLValue.newCLUInt512(amount.toString()),
    });

    return this.casperService.sendDeploy(
      contractHash,
      'confirm_delegation',
      args,
      '5000000000', // 5 CSPR gas
    );
  }

  /**
   * Process all pending undelegations
   */
  async processUndelegations(): Promise<void> {
    try {
      this.logger.log('Starting undelegation processing...');

      const pendingUndelegations = await this.getPendingUndelegations();

      if (pendingUndelegations.length === 0) {
        this.logger.log('No pending undelegations to process');
        return;
      }

      this.logger.log(
        `Found ${pendingUndelegations.length} pending undelegations`,
      );

      for (const undelegation of pendingUndelegations) {
        try {
          await this.processSingleUndelegation(undelegation);
        } catch (error) {
          this.logger.error(
            `Failed to process undelegation from ${undelegation.validator}: ${getErrorMessage(error)}`,
            getErrorStack(error),
          );
        }
      }

      this.logger.log('Undelegation processing completed');
    } catch (error) {
      this.logger.error(
        `Undelegation processing failed: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
    }
  }

  /**
   * Get pending undelegations from contract
   */
  private async getPendingUndelegations(): Promise<PendingDelegation[]> {
    // Similar to getPendingDelegations but for undelegations
    // TODO: Implement contract state query
    return [];
  }

  /**
   * Process a single undelegation
   */
  private async processSingleUndelegation(
    undelegation: PendingDelegation,
  ): Promise<void> {
    this.logger.log(
      `Processing undelegation from ${undelegation.validator}: ${undelegation.amount} motes`,
    );

    // Step 1: Undelegate from validator via auction contract
    const undelegateHash = await this.undelegateFromValidator(
      undelegation.validator,
      undelegation.amount,
    );

    const undelegateSuccess =
      await this.casperService.waitForDeploy(undelegateHash);
    if (!undelegateSuccess) {
      throw new Error(`Undelegation failed: ${undelegateHash}`);
    }

    this.logger.log(`Undelegation successful: ${undelegateHash}`);

    // Step 2: Confirm undelegation in contract
    const confirmHash = await this.confirmUndelegation(
      undelegation.validator,
      undelegation.amount,
    );

    const confirmSuccess = await this.casperService.waitForDeploy(confirmHash);
    if (!confirmSuccess) {
      throw new Error(`Confirm undelegation failed: ${confirmHash}`);
    }

    this.logger.log(
      `Undelegation confirmed for ${undelegation.validator}: ${confirmHash}`,
    );

    // Note: After unbonding period (7 eras), keeper needs to deposit CSPR back
    // This can be handled by a separate scheduled task that checks matured undelegations
  }

  /**
   * Undelegate from validator via auction contract
   */
  private async undelegateFromValidator(
    validatorPubKey: string,
    amount: bigint,
  ): Promise<string> {
    const chainName =
      this.configService.get<string>('chainName') || 'casper-test';

    const args = Args.fromMap({
      delegator: CLValue.newCLPublicKey(this.publicKey),
      validator: CLValue.newCLPublicKey(PublicKey.fromHex(validatorPubKey)),
      amount: CLValue.newCLUInt512(amount.toString()),
    });

    const transaction = new ContractCallBuilder()
      .from(this.publicKey)
      .byHash(this.auctionContractHash.replace('hash-', ''))
      .entryPoint('undelegate')
      .runtimeArgs(args)
      .chainName(chainName)
      .payment(parseInt(DELEGATION_GAS, 10))
      .build();

    transaction.sign(this.privateKey);

    const result = await this.client.putTransaction(transaction);
    this.logger.log(
      `Undelegate transaction sent: ${result.transactionHash.toHex()}`,
    );

    return result.transactionHash.toHex();
  }

  /**
   * Confirm undelegation in liquid staking contract
   */
  private async confirmUndelegation(
    validatorPubKey: string,
    amount: bigint,
  ): Promise<string> {
    const contractHash =
      this.configService.get<string>('liquidStakingContractPackageHash') || '';

    const args = Args.fromMap({
      validator: CLValue.newCLPublicKey(PublicKey.fromHex(validatorPubKey)),
      amount: CLValue.newCLUInt512(amount.toString()),
    });

    return this.casperService.sendDeploy(
      contractHash,
      'confirm_undelegation',
      args,
      '5000000000',
    );
  }

  /**
   * Deposit matured undelegation CSPR back to contract
   * Called after unbonding period completes
   * Note: This sends CSPR with the transaction via the payment amount
   */
  async depositFromUndelegation(amount: bigint): Promise<string> {
    const contractHash =
      this.configService.get<string>('liquidStakingContractPackageHash') || '';
    const chainName =
      this.configService.get<string>('chainName') || 'casper-test';

    // For payable functions in casper-js-sdk, we need to use native transfer
    // or a session that handles the CSPR transfer
    // The payment amount covers gas, the actual CSPR is sent via the transaction value
    const transaction = new ContractCallBuilder()
      .from(this.publicKey)
      .byPackageHash(contractHash)
      .entryPoint('deposit_from_undelegation')
      .runtimeArgs(Args.fromMap({}))
      .chainName(chainName)
      .payment(Number(amount) + 5_000_000_000) // Amount + gas
      .build();

    transaction.sign(this.privateKey);

    const result = await this.client.putTransaction(transaction);
    this.logger.log(
      `Deposit from undelegation sent: ${result.transactionHash.toHex()}`,
    );

    return result.transactionHash.toHex();
  }
}
