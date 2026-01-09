import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { CasperService } from './src/casper/casper.service';

async function testDelegate() {
  console.log('Starting delegation test...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const casperService = app.get(CasperService);

  // Test parameters
  const validatorPublicKey =
    '01000019478b67d07c3adc460db360deef6c663ec55ba29db70b458e47022a3d81'; // Active validator from testnet
  const amount = '500000000000'; // 500 CSPR (minimum delegation)

  try {
    console.log(`Delegating ${amount} motes to validator ${validatorPublicKey}`);

    const deployHash = await casperService.delegate(
      validatorPublicKey,
      amount,
    );

    console.log(`Delegation transaction sent: ${deployHash}`);
    console.log(
      `Check transaction: https://testnet.cspr.live/deploy/${deployHash}`,
    );

    console.log('Waiting for transaction to complete...');
    const success = await casperService.waitForDeploy(deployHash);

    if (success) {
      console.log('✅ Delegation successful!');
    } else {
      console.log('❌ Delegation failed');
    }
  } catch (error) {
    console.error('Error during delegation:', error);
  }

  await app.close();
}

testDelegate().catch(console.error);
