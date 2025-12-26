import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CasperService } from '../casper/casper.service';
import { CLValue, Args } from 'casper-js-sdk';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) return error.stack;
  return undefined;
}

@Injectable()
export class LiquidStakingService {
  private readonly logger = new Logger(LiquidStakingService.name);

  constructor(
    private casperService: CasperService,
    private configService: ConfigService,
  ) {}

  async harvestRewards(): Promise<void> {
    try {
      this.logger.log('Starting reward harvest...');

      const currentEra = await this.casperService.getCurrentEra();
      this.logger.log(`Harvesting rewards for era: ${currentEra}`);

      await this.sendHarvestToContract(currentEra);

      this.logger.log('Rewards harvested successfully');
    } catch (error) {
      this.logger.error(
        `Reward harvest failed: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
    }
  }

  private async sendHarvestToContract(currentEra: number): Promise<void> {
    const contractHash =
      this.configService.get<string>('liquidStakingContractPackageHash') || '';

    const args = Args.fromMap({
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

  async processWithdrawals(): Promise<void> {
    try {
      this.logger.log('Processing matured withdrawals...');

      const currentEra = await this.casperService.getCurrentEra();

      await this.sendProcessWithdrawalsToContract(currentEra);

      this.logger.log('Withdrawals processed successfully');
    } catch (error) {
      this.logger.error(
        `Process withdrawals failed: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
    }
  }

  private async sendProcessWithdrawalsToContract(
    currentEra: number,
  ): Promise<void> {
    const contractHash =
      this.configService.get<string>('liquidStakingContractPackageHash') || '';

    const args = Args.fromMap({
      current_era: CLValue.newCLUint64(currentEra),
      max_requests: CLValue.newCLUint64(50),
    });

    const deployHash = await this.casperService.sendDeploy(
      contractHash,
      'process_withdrawals',
      args,
      '20000000000',
    );

    const success = await this.casperService.waitForDeploy(deployHash);
    if (!success) {
      throw new Error(`Process withdrawals deploy failed: ${deployHash}`);
    }

    this.logger.log(`Withdrawals processed: ${deployHash}`);
  }
}
