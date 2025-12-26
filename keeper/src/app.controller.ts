import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ValidatorRegistryService } from './validator-registry/validator-registry.service';
import { LiquidStakingService } from './liquid-staking/liquid-staking.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly validatorRegistryService: ValidatorRegistryService,
    private readonly liquidStakingService: LiquidStakingService,
  ) {}

  @Get()
  getStatus(): object {
    return {
      status: 'running',
      service: 'Stayer Protocol Keeper',
    };
  }

  @Post('update-validators')
  async updateValidators(): Promise<object> {
    await this.validatorRegistryService.updateValidators();
    return { message: 'Validator update triggered' };
  }

  @Post('harvest-rewards')
  async harvestRewards(): Promise<object> {
    await this.liquidStakingService.harvestRewards();
    return { message: 'Reward harvest triggered' };
  }

  @Post('process-withdrawals')
  async processWithdrawals(): Promise<object> {
    await this.liquidStakingService.processWithdrawals();
    return { message: 'Withdrawal processing triggered' };
  }
}
