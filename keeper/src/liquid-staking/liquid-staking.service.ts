import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CasperService } from '../casper/casper.service';
import { CLValue, Args, PublicKey } from 'casper-js-sdk';
import axios from 'axios';
import { UnbondingTracker } from './unbonding-tracker';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) return error.stack;
  return undefined;
}

interface PendingDelegation {
  validator: string; // hex string
  amount: string; // U512 as string
  era: number;
}

interface PendingUndelegation {
  validator: string; // hex string
  amount: string; // U512 as string
  era: number;
}

@Injectable()
export class LiquidStakingService {
  private readonly logger = new Logger(LiquidStakingService.name);

  constructor(
    private casperService: CasperService,
    private configService: ConfigService,
    private unbondingTracker: UnbondingTracker,
  ) {}

  /**
   * Harvest rewards by calculating total delegated amount and reporting to contract
   */
  async harvestRewards(): Promise<void> {
    try {
      this.logger.log('Starting reward harvest...');

      const currentEra = await this.casperService.getCurrentEra();
      this.logger.log(`Harvesting rewards for era: ${currentEra}`);

      // Calculate total delegation by querying auction info
      const totalDelegation = await this.casperService.getTotalDelegation();
      const newTotalDelegation = totalDelegation.toString();

      this.logger.log(
        `Total delegation across all validators: ${newTotalDelegation} motes`,
      );

      await this.sendHarvestToContract(newTotalDelegation, currentEra);

      this.logger.log('Rewards harvested successfully');
    } catch (error) {
      this.logger.error(
        `Reward harvest failed: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
    }
  }

  private async sendHarvestToContract(
    newTotalDelegation: string,
    currentEra: number,
  ): Promise<void> {
    const contractHash =
      this.configService.get<string>('liquidStakingContractPackageHash') || '';

    const args = Args.fromMap({
      new_total_delegation: CLValue.newCLUInt512(newTotalDelegation),
      current_era: CLValue.newCLUint64(currentEra),
    });

    const deployHash = await this.casperService.sendDeploy(
      contractHash,
      'harvest_rewards',
      args,
      '15000000000',
    );

    const success = await this.casperService.waitForDeploy(deployHash);
    if (!success) {
      throw new Error(`Harvest rewards deploy failed: ${deployHash}`);
    }

    this.logger.log(`Harvest completed: ${deployHash}`);
  }

  /**
   * Process pending delegations:
   * 1. Query get_pending_delegations from contract via CSPR Cloud API
   * 2. For each pending delegation:
   *    - Call withdraw_for_delegation to get CSPR
   *    - Delegate to validator via Casper native delegation
   *    - Call confirm_delegation to mark as done
   */
  async processDelegations(): Promise<void> {
    try {
      this.logger.log('Processing pending delegations...');

      const contractHash =
        this.configService.get<string>('liquidStakingContractPackageHash') ||
        '';
      const csprCloudUrl =
        this.configService.get<string>('csprCloudApiUrl') || '';
      const csprCloudKey =
        this.configService.get<string>('csprCloudApiKey') || '';

      if (!csprCloudUrl || !csprCloudKey) {
        this.logger.warn(
          'CSPR Cloud API not configured, skipping delegation processing',
        );
        return;
      }

      // Query pending delegations from contract
      const pendingDelegations = await this.queryPendingDelegations(
        contractHash,
        csprCloudUrl,
        csprCloudKey,
      );

      if (!pendingDelegations || pendingDelegations.length === 0) {
        this.logger.log('No pending delegations to process');
        return;
      }

      this.logger.log(
        `Found ${pendingDelegations.length} pending delegation(s)`,
      );

      // Process each delegation
      for (const pending of pendingDelegations) {
        try {
          await this.processSingleDelegation(pending, contractHash);
        } catch (error) {
          this.logger.error(
            `Failed to process delegation to ${pending.validator}: ${getErrorMessage(error)}`,
          );
          // Continue with next delegation
        }
      }

      this.logger.log('Delegations processed successfully');
    } catch (error) {
      this.logger.error(
        `Delegation processing failed: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
    }
  }

  private async queryPendingDelegations(
    contractHash: string,
    apiUrl: string,
    apiKey: string,
  ): Promise<PendingDelegation[]> {
    try {
      const response = await axios.post(
        `${apiUrl}/rpc`,
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'query_global_state',
          params: {
            state_identifier: {
              StateRootHash: await this.casperService.getCurrentEra(),
            },
            key: `hash-${contractHash}`,
            path: ['pending_delegations'],
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
        },
      );

      if (response.data?.result?.stored_value?.CLValue) {
        // Parse CLValue to get pending delegations array
        const clValue = response.data.result.stored_value.CLValue;
        // TODO: Parse CLValue based on actual contract storage format
        this.logger.debug(
          `Pending delegations CLValue: ${JSON.stringify(clValue)}`,
        );
        return [];
      }

      return [];
    } catch (error) {
      this.logger.warn(
        `Failed to query pending delegations: ${getErrorMessage(error)}`,
      );
      return [];
    }
  }

  private async processSingleDelegation(
    pending: PendingDelegation,
    contractHash: string,
  ): Promise<void> {
    this.logger.log(
      `Processing delegation: ${pending.amount} motes to validator ${pending.validator}`,
    );

    // Step 1: Withdraw CSPR from contract
    const withdrawArgs = Args.fromMap({
      validator: CLValue.newCLPublicKey(PublicKey.fromHex(pending.validator)),
      amount: CLValue.newCLUInt512(pending.amount),
    });

    const withdrawHash = await this.casperService.sendDeploy(
      contractHash,
      'withdraw_for_delegation',
      withdrawArgs,
      '5000000000', // 5 CSPR
    );

    const withdrawSuccess =
      await this.casperService.waitForDeploy(withdrawHash);
    if (!withdrawSuccess) {
      throw new Error(`Withdraw for delegation failed: ${withdrawHash}`);
    }

    this.logger.log(`Withdrawn CSPR for delegation: ${withdrawHash}`);

    // Step 2: Delegate to validator via auction contract
    const delegateHash = await this.casperService.delegate(
      pending.validator,
      pending.amount,
    );

    const delegateSuccess =
      await this.casperService.waitForDeploy(delegateHash);
    if (!delegateSuccess) {
      throw new Error(`Native delegation failed: ${delegateHash}`);
    }

    this.logger.log(`Delegated to validator: ${delegateHash}`);

    // Step 3: Confirm delegation to contract
    const confirmArgs = Args.fromMap({
      validator: CLValue.newCLPublicKey(PublicKey.fromHex(pending.validator)),
      amount: CLValue.newCLUInt512(pending.amount),
    });

    const confirmHash = await this.casperService.sendDeploy(
      contractHash,
      'confirm_delegation',
      confirmArgs,
      '5000000000', // 5 CSPR
    );

    const confirmSuccess = await this.casperService.waitForDeploy(confirmHash);
    if (!confirmSuccess) {
      throw new Error(`Confirm delegation failed: ${confirmHash}`);
    }

    this.logger.log(
      `Delegation confirmed for validator ${pending.validator}: ${confirmHash}`,
    );
  }

  /**
   * Process pending undelegations:
   * 1. Query get_pending_undelegations from contract
   * 2. For each pending undelegation:
   *    - Undelegate from validator via Casper native undelegation
   *    - Call confirm_undelegation to mark as done
   * 3. After unbonding period (7 eras), call deposit_from_undelegation with CSPR
   */
  async processUndelegations(): Promise<void> {
    try {
      this.logger.log('Processing pending undelegations...');

      const contractHash =
        this.configService.get<string>('liquidStakingContractPackageHash') ||
        '';
      const csprCloudUrl =
        this.configService.get<string>('csprCloudApiUrl') || '';
      const csprCloudKey =
        this.configService.get<string>('csprCloudApiKey') || '';

      if (!csprCloudUrl || !csprCloudKey) {
        this.logger.warn(
          'CSPR Cloud API not configured, skipping undelegation processing',
        );
        return;
      }

      // Query pending undelegations from contract
      const pendingUndelegations = await this.queryPendingUndelegations(
        contractHash,
        csprCloudUrl,
        csprCloudKey,
      );

      if (!pendingUndelegations || pendingUndelegations.length === 0) {
        this.logger.log('No pending undelegations to process');
        return;
      }

      this.logger.log(
        `Found ${pendingUndelegations.length} pending undelegation(s)`,
      );

      // Process each undelegation
      for (const pending of pendingUndelegations) {
        try {
          await this.processSingleUndelegation(pending, contractHash);
        } catch (error) {
          this.logger.error(
            `Failed to process undelegation from ${pending.validator}: ${getErrorMessage(error)}`,
          );
          // Continue with next undelegation
        }
      }

      this.logger.log('Undelegations processed successfully');
    } catch (error) {
      this.logger.error(
        `Undelegation processing failed: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
    }
  }

  private async queryPendingUndelegations(
    contractHash: string,
    apiUrl: string,
    apiKey: string,
  ): Promise<PendingUndelegation[]> {
    try {
      const response = await axios.post(
        `${apiUrl}/rpc`,
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'query_global_state',
          params: {
            state_identifier: {
              StateRootHash: await this.casperService.getCurrentEra(),
            },
            key: `hash-${contractHash}`,
            path: ['pending_undelegations'],
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
        },
      );

      if (response.data?.result?.stored_value?.CLValue) {
        // Parse CLValue to get pending undelegations array
        const clValue = response.data.result.stored_value.CLValue;
        // TODO: Parse CLValue based on actual contract storage format
        this.logger.debug(
          `Pending undelegations CLValue: ${JSON.stringify(clValue)}`,
        );
        return [];
      }

      return [];
    } catch (error) {
      this.logger.warn(
        `Failed to query pending undelegations: ${getErrorMessage(error)}`,
      );
      return [];
    }
  }

  private async processSingleUndelegation(
    pending: PendingUndelegation,
    contractHash: string,
  ): Promise<void> {
    this.logger.log(
      `Processing undelegation: ${pending.amount} motes from validator ${pending.validator}`,
    );

    // Step 1: Undelegate from validator via auction contract
    const undelegateHash = await this.casperService.undelegate(
      pending.validator,
      pending.amount,
    );

    const undelegateSuccess =
      await this.casperService.waitForDeploy(undelegateHash);
    if (!undelegateSuccess) {
      throw new Error(`Native undelegation failed: ${undelegateHash}`);
    }

    this.logger.log(`Undelegated from validator: ${undelegateHash}`);

    // Step 2: Confirm undelegation to contract
    const confirmArgs = Args.fromMap({
      validator: CLValue.newCLPublicKey(PublicKey.fromHex(pending.validator)),
      amount: CLValue.newCLUInt512(pending.amount),
    });

    const confirmHash = await this.casperService.sendDeploy(
      contractHash,
      'confirm_undelegation',
      confirmArgs,
      '5000000000', // 5 CSPR
    );

    const confirmSuccess = await this.casperService.waitForDeploy(confirmHash);
    if (!confirmSuccess) {
      throw new Error(`Confirm undelegation failed: ${confirmHash}`);
    }

    this.logger.log(
      `Undelegation confirmed for validator ${pending.validator}: ${confirmHash}`,
    );

    // Track unbonding for automatic deposit after 7 eras
    const currentEra = await this.casperService.getCurrentEra();
    this.unbondingTracker.addUnbonding(
      pending.validator,
      pending.amount,
      currentEra,
      confirmHash,
    );
  }

  /**
   * Process completed unbondings and deposit CSPR back to contract
   * Should be called periodically (e.g., every 30 minutes)
   */
  async processUnbondingDeposits(): Promise<void> {
    try {
      this.logger.log('Processing unbonding deposits...');

      const currentEra = await this.casperService.getCurrentEra();
      const readyUnbondings =
        this.unbondingTracker.getReadyUnbondings(currentEra);

      if (!readyUnbondings || readyUnbondings.length === 0) {
        this.logger.log('No unbondings ready for deposit');
        return;
      }

      this.logger.log(
        `Found ${readyUnbondings.length} unbonding(s) ready for deposit`,
      );

      const contractHash =
        this.configService.get<string>('liquidStakingContractPackageHash') ||
        '';

      // Process each ready unbonding
      for (const unbonding of readyUnbondings) {
        try {
          await this.depositFromUnbonding(
            unbonding.validator,
            unbonding.amount,
            contractHash,
          );
          this.unbondingTracker.markAsDeposited(
            unbonding.validator,
            unbonding.amount,
          );
        } catch (error) {
          this.logger.error(
            `Failed to deposit unbonding from ${unbonding.validator}: ${getErrorMessage(error)}`,
          );
          // Continue with next unbonding
        }
      }

      // Cleanup old records
      this.unbondingTracker.cleanupOldRecords();

      this.logger.log('Unbonding deposits processed successfully');
    } catch (error) {
      this.logger.error(
        `Unbonding deposit processing failed: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
    }
  }

  private async depositFromUnbonding(
    validator: string,
    amount: string,
    contractHash: string,
  ): Promise<void> {
    this.logger.log(
      `Depositing ${amount} motes from unbonding (validator: ${validator})`,
    );

    // Call deposit_from_undelegation on contract
    // The CSPR should already be in keeper account after unbonding period
    const args = Args.fromMap({
      validator: CLValue.newCLPublicKey(PublicKey.fromHex(validator)),
      amount: CLValue.newCLUInt512(amount),
    });

    const depositHash = await this.casperService.sendDeploy(
      contractHash,
      'deposit_from_undelegation',
      args,
      '5000000000', // 5 CSPR
    );

    const depositSuccess = await this.casperService.waitForDeploy(depositHash);
    if (!depositSuccess) {
      throw new Error(`Deposit from undelegation failed: ${depositHash}`);
    }

    this.logger.log(`Deposited unbonding CSPR to contract: ${depositHash}`);
  }
}
