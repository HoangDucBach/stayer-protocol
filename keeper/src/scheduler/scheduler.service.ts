import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { ValidatorRegistryService } from '../validator-registry/validator-registry.service';
import { LiquidStakingService } from '../liquid-staking/liquid-staking.service';
import { DelegationService } from '../delegation/delegation.service';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private validatorRegistryService: ValidatorRegistryService,
    private liquidStakingService: LiquidStakingService,
    private delegationService: DelegationService,
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

    // Setup delegation processing interval
    const delegationInterval =
      this.configService.get<number>('delegationIntervalMs') || 3600000;
    const delegationTimer = setInterval(() => {
      void this.handleDelegationProcessing();
    }, delegationInterval);
    this.schedulerRegistry.addInterval('processDelegations', delegationTimer);
    this.logger.log(
      `Delegation processing scheduled every ${delegationInterval}ms (${delegationInterval / 1000 / 60} minutes)`,
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

  async handleDelegationProcessing() {
    this.logger.log('Executing scheduled delegation processing...');
    try {
      await this.delegationService.processDelegations();
      await this.delegationService.processUndelegations();
    } catch (error) {
      this.logger.error(
        `Scheduled delegation processing failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
