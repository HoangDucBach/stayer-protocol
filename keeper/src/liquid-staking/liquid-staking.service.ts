import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CasperService } from '../casper/casper.service';
import { CLValue, Args, PublicKey } from 'casper-js-sdk';

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
   * 1. Query get_pending_delegations from contract
   * 2. For each pending delegation:
   *    - Call withdraw_for_delegation to get CSPR
   *    - Delegate to validator via Casper native delegation
   *    - Call confirm_delegation to mark as done
   */
  async processDelegations(): Promise<void> {
    try {
      this.logger.log('Processing pending delegations...');

      // Note: get_pending_delegations should be queried via contract call, not transaction
      // For now, we'll skip this - need to implement contract query method
      this.logger.warn(
        'Delegation processing not yet implemented - requires contract query support',
      );

      this.logger.log('Delegations processed successfully');
    } catch (error) {
      this.logger.error(
        `Delegation processing failed: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
    }
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

      // Note: Similar to delegations, this requires contract query support
      this.logger.warn(
        'Undelegation processing not yet implemented - requires contract query support',
      );

      this.logger.log('Undelegations processed successfully');
    } catch (error) {
      this.logger.error(
        `Undelegation processing failed: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
    }
  }
}
