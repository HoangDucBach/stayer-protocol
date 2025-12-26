import { Module } from '@nestjs/common';
import { CasperService } from './casper.service';

@Module({
  providers: [CasperService],
  exports: [CasperService],
})
export class CasperModule {}
