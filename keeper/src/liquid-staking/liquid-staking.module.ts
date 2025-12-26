import { Module } from '@nestjs/common';
import { LiquidStakingService } from './liquid-staking.service';
import { CasperModule } from '../casper/casper.module';

@Module({
  imports: [CasperModule],
  providers: [LiquidStakingService],
  exports: [LiquidStakingService],
})
export class LiquidStakingModule {}
