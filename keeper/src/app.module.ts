import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { config } from './config/config';
import { CasperModule } from './casper/casper.module';
import { ValidatorRegistryModule } from './validator-registry/validator-registry.module';
import { LiquidStakingModule } from './liquid-staking/liquid-staking.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    CasperModule,
    ValidatorRegistryModule,
    LiquidStakingModule,
    SchedulerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
