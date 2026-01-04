import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { ValidatorRegistryModule } from '../validator-registry/validator-registry.module';
import { LiquidStakingModule } from '../liquid-staking/liquid-staking.module';
import { DelegationModule } from '../delegation/delegation.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ValidatorRegistryModule,
    LiquidStakingModule,
    DelegationModule,
  ],
  providers: [SchedulerService],
})
export class SchedulerModule {}
