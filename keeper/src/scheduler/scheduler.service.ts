import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { ValidatorRegistryService } from '../validator-registry/validator-registry.service';
import { LiquidStakingService } from '../liquid-staking/liquid-staking.service';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private validatorRegistryService: ValidatorRegistryService,
    private liquidStakingService: LiquidStakingService,
    private configService: ConfigService,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    // Setup validator update interval
    const updateInterval =
      this.configService.get<number>('updateIntervalMs') || 3600000;
    const validatorUpdateTimer = setInterval(() => {
      void this.handleValidatorUpdate();
    }, updateInterval);
    this.schedulerRegistry.addInterval(
      'updateValidators',
      validatorUpdateTimer,
    );
    this.logger.log(
      `Validator update scheduled every ${updateInterval}ms (${updateInterval / 1000 / 60} minutes)`,
    );

    // Setup harvest rewards interval
    const harvestInterval =
      this.configService.get<number>('harvestIntervalMs') || 7200000;
    const harvestTimer = setInterval(() => {
      void this.handleRewardHarvest();
    }, harvestInterval);
    this.schedulerRegistry.addInterval('harvestRewards', harvestTimer);
    this.logger.log(
      `Reward harvest scheduled every ${harvestInterval}ms (${harvestInterval / 1000 / 60} minutes)`,
    );

    // Setup withdrawal processing interval
    const withdrawalInterval =
      this.configService.get<number>('withdrawalIntervalMs') || 1800000;
    const withdrawalTimer = setInterval(() => {
      void this.handleWithdrawalProcessing();
    }, withdrawalInterval);
    this.schedulerRegistry.addInterval('processWithdrawals', withdrawalTimer);
    this.logger.log(
      `Withdrawal processing scheduled every ${withdrawalInterval}ms (${withdrawalInterval / 1000 / 60} minutes)`,
    );
  }

  async handleValidatorUpdate() {
    this.logger.log('Executing scheduled validator update...');
    try {
      await this.validatorRegistryService.updateValidators();
    } catch (error) {
      this.logger.error(
        `Scheduled validator update failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async handleRewardHarvest() {
    this.logger.log('Executing scheduled reward harvest...');
    try {
      await this.liquidStakingService.harvestRewards();
    } catch (error) {
      this.logger.error(
        `Scheduled reward harvest failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async handleWithdrawalProcessing() {
    this.logger.log('Executing scheduled withdrawal processing...');
    try {
      await this.liquidStakingService.processWithdrawals();
    } catch (error) {
      this.logger.error(
        `Scheduled withdrawal processing failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
