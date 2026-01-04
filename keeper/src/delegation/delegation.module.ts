import { Module } from '@nestjs/common';
import { DelegationService } from './delegation.service';
import { CasperModule } from '../casper/casper.module';

@Module({
  imports: [CasperModule],
  providers: [DelegationService],
  exports: [DelegationService],
})
export class DelegationModule {}
