import { Module } from '@nestjs/common';
import { LiquidStakingService } from './liquid-staking.service';
import { UnbondingTracker } from './unbonding-tracker';
import { CasperModule } from '../casper/casper.module';

@Module({
  imports: [CasperModule],
  providers: [LiquidStakingService, UnbondingTracker],
  exports: [LiquidStakingService],
})
export class LiquidStakingModule {}
