import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CasperService, ValidatorInfo } from '../casper/casper.service';
import { CLValue, Args, PublicKey } from 'casper-js-sdk';

interface ValidatorUpdateData {
  pubkey: string;
  fee: number;
  isActive: boolean;
  decayFactor: number;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) return error.stack;
  return undefined;
}

@Injectable()
export class ValidatorRegistryService {
  private readonly logger = new Logger(ValidatorRegistryService.name);
  private readonly DECAY_WINDOW = 30;

  constructor(
    private casperService: CasperService,
    private configService: ConfigService,
  ) {}

  async updateValidators(): Promise<void> {
    try {
      this.logger.log('Starting validator update...');

      const validators = await this.casperService.getValidators();
      if (validators.length === 0) {
        this.logger.warn('No validators found');
        return;
      }

      const currentEra = await this.casperService.getCurrentEra();
      this.logger.log(`Current era: ${currentEra}`);

      const performanceScores = await this.fetchPerformanceScores(currentEra);
      this.logger.log(
        `Fetched performance scores for ${performanceScores.size} validators`,
      );

      const validatorUpdates: ValidatorUpdateData[] = validators.map((v) => ({
        pubkey: v.publicKey,
        fee: v.fee,
        isActive: v.isActive,
        decayFactor: this.calculateDecayFactor(
          v,
          performanceScores.get(v.publicKey),
        ),
      }));

      const BATCH_SIZE = 30;
      const totalBatches = Math.ceil(validatorUpdates.length / BATCH_SIZE);

      this.logger.log(
        `Updating ${validatorUpdates.length} validators in ${totalBatches} batches`,
      );

      for (let i = 0; i < validatorUpdates.length; i += BATCH_SIZE) {
        const batch = validatorUpdates.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

        this.logger.log(
          `Processing batch ${batchNumber}/${totalBatches} (${batch.length} validators)`,
        );

        await this.sendUpdateToContract(batch, currentEra);

        if (i + BATCH_SIZE < validatorUpdates.length) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      this.logger.log(
        `Successfully updated ${validatorUpdates.length} validators`,
      );
    } catch (error) {
      this.logger.error(
        `Validator update failed: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
    }
  }

  private async fetchPerformanceScores(
    eraId: number,
  ): Promise<Map<string, number>> {
    const apiKey = this.configService.get<string>('csprCloudApiKey');
    const apiUrl = this.configService.get<string>('csprCloudApiUrl');

    if (!apiKey || !apiUrl) {
      this.logger.warn('CSPR.cloud API not configured');
      return new Map();
    }

    try {
      const ERAS_TO_FETCH = 10;
      const promises: Promise<Response>[] = [];

      for (let i = 0; i < ERAS_TO_FETCH; i++) {
        const targetEra = eraId - i;
        if (targetEra < 0) break;

        promises.push(
          fetch(
            `${apiUrl}/validator-performance/get-historical-average-validators-performance?start_era=${targetEra}&end_era=${targetEra}`,
            {
              headers: { Authorization: `Bearer ${apiKey}` },
            },
          ),
        );
      }

      const responses = await Promise.all(promises);
      const scores = new Map<string, number[]>();

      for (const response of responses) {
        if (!response.ok) continue;

        const data = (await response.json()) as {
          data: Array<{ public_key: string; score: number }>;
        };

        for (const validator of data.data) {
          if (!scores.has(validator.public_key)) {
            scores.set(validator.public_key, []);
          }
          scores.get(validator.public_key)!.push(validator.score);
        }
      }

      const avgScores = new Map<string, number>();
      scores.forEach((scoreList, pubkey) => {
        const avg = scoreList.reduce((sum, s) => sum + s, 0) / scoreList.length;
        avgScores.set(pubkey, avg);
      });

      return avgScores;
    } catch (error) {
      this.logger.error(
        `Failed to fetch performance: ${error instanceof Error ? error.message : String(error)}`,
      );
      return new Map();
    }
  }

  private calculateDecayFactor(
    validator: ValidatorInfo,
    performanceScore?: number,
  ): number {
    if (!validator.isActive) {
      return 0;
    }

    if (performanceScore === undefined) {
      return 100;
    }

    const decayFactor = Math.round(80 + performanceScore * 0.2);
    return Math.max(80, Math.min(100, decayFactor));
  }

  private async sendUpdateToContract(
    validators: ValidatorUpdateData[],
    currentEra: number,
  ): Promise<void> {
    const contractHash =
      this.configService.get<string>('validatorRegistryContractPackageHash') ||
      '';

    if (validators.length === 0) {
      throw new Error('No validators to update');
    }

    const serializedValidators: Uint8Array[] = validators.map((v) => {
      const pubkeyBytes = CLValue.newCLPublicKey(
        PublicKey.fromHex(v.pubkey),
      ).bytes();
      const feeBytes = CLValue.newCLUint64(v.fee).bytes();
      const isActiveBytes = CLValue.newCLValueBool(v.isActive).bytes();
      const decayFactorBytes = CLValue.newCLUint64(v.decayFactor).bytes();

      const structBytes = new Uint8Array(
        pubkeyBytes.length +
          feeBytes.length +
          isActiveBytes.length +
          decayFactorBytes.length,
      );

      let offset = 0;
      structBytes.set(pubkeyBytes, offset);
      offset += pubkeyBytes.length;
      structBytes.set(feeBytes, offset);
      offset += feeBytes.length;
      structBytes.set(isActiveBytes, offset);
      offset += isActiveBytes.length;
      structBytes.set(decayFactorBytes, offset);

      return structBytes;
    });

    const totalSize = serializedValidators.reduce(
      (sum, bytes) => sum + bytes.length,
      0,
    );
    const vecBytes = new Uint8Array(4 + totalSize);

    new DataView(vecBytes.buffer).setUint32(0, validators.length, true);

    let offset = 4;
    for (const structBytes of serializedValidators) {
      vecBytes.set(structBytes, offset);
      offset += structBytes.length;
    }

    const args = Args.fromMap({
      validators_data: CLValue.newCLAny(vecBytes),
      p_avg: CLValue.newCLUint64(80),
      current_era: CLValue.newCLUint64(currentEra),
    });

    const deployHash = await this.casperService.sendDeploy(
      contractHash,
      'update_validators',
      args,
      '100000000000',
    );

    this.logger.log(`Transaction sent: ${deployHash}`);
  }
}
