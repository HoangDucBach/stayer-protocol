import { Module } from '@nestjs/common';
import { ValidatorRegistryService } from './validator-registry.service';
import { CasperModule } from '../casper/casper.module';

@Module({
  imports: [CasperModule],
  providers: [ValidatorRegistryService],
  exports: [ValidatorRegistryService],
})
export class ValidatorRegistryModule {}
