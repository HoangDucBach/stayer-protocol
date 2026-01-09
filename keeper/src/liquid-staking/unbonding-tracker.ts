import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export interface UnbondingRecord {
  validator: string;
  amount: string;
  startEra: number;
  completeEra: number; // startEra + 7
  deposited: boolean;
  confirmHash: string;
  createdAt: number;
}

@Injectable()
export class UnbondingTracker {
  private readonly logger = new Logger(UnbondingTracker.name);
  private readonly storageFile: string;
  private records: UnbondingRecord[] = [];

  constructor(private configService: ConfigService) {
    // Store unbonding records in a JSON file
    this.storageFile = path.resolve(
      process.cwd(),
      'data',
      'unbonding-records.json',
    );
    this.ensureStorageExists();
    this.loadRecords();
  }

  private ensureStorageExists(): void {
    const dir = path.dirname(this.storageFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.storageFile)) {
      fs.writeFileSync(this.storageFile, JSON.stringify([], null, 2));
    }
  }

  private loadRecords(): void {
    try {
      const data = fs.readFileSync(this.storageFile, 'utf8');
      this.records = JSON.parse(data);
      this.logger.log(`Loaded ${this.records.length} unbonding record(s)`);
    } catch (error) {
      this.logger.error(`Failed to load unbonding records: ${error}`);
      this.records = [];
    }
  }

  private saveRecords(): void {
    try {
      fs.writeFileSync(this.storageFile, JSON.stringify(this.records, null, 2));
    } catch (error) {
      this.logger.error(`Failed to save unbonding records: ${error}`);
    }
  }

  /**
   * Add new unbonding record when confirm_undelegation succeeds
   */
  addUnbonding(
    validator: string,
    amount: string,
    currentEra: number,
    confirmHash: string,
  ): void {
    const record: UnbondingRecord = {
      validator,
      amount,
      startEra: currentEra,
      completeEra: currentEra + 7, // Unbonding period is 7 eras
      deposited: false,
      confirmHash,
      createdAt: Date.now(),
    };

    this.records.push(record);
    this.saveRecords();

    this.logger.log(
      `Added unbonding record: validator=${validator}, amount=${amount}, completeEra=${record.completeEra}`,
    );
  }

  /**
   * Get all unbondings that are ready to be deposited (completeEra <= currentEra)
   */
  getReadyUnbondings(currentEra: number): UnbondingRecord[] {
    return this.records.filter(
      (r) => !r.deposited && r.completeEra <= currentEra,
    );
  }

  /**
   * Mark unbonding as deposited after deposit_from_undelegation succeeds
   */
  markAsDeposited(validator: string, amount: string): void {
    const record = this.records.find(
      (r) => r.validator === validator && r.amount === amount && !r.deposited,
    );

    if (record) {
      record.deposited = true;
      this.saveRecords();
      this.logger.log(
        `Marked unbonding as deposited: validator=${validator}, amount=${amount}`,
      );
    }
  }

  /**
   * Clean up old deposited records (older than 30 days)
   */
  cleanupOldRecords(): void {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const initialCount = this.records.length;

    this.records = this.records.filter(
      (r) => !r.deposited || r.createdAt > thirtyDaysAgo,
    );

    const cleaned = initialCount - this.records.length;
    if (cleaned > 0) {
      this.saveRecords();
      this.logger.log(`Cleaned up ${cleaned} old unbonding record(s)`);
    }
  }

  /**
   * Get all pending unbondings (not yet deposited)
   */
  getPendingUnbondings(): UnbondingRecord[] {
    return this.records.filter((r) => !r.deposited);
  }

  /**
   * Get statistics
   */
  getStats(currentEra: number): {
    total: number;
    pending: number;
    ready: number;
    deposited: number;
  } {
    return {
      total: this.records.length,
      pending: this.records.filter((r) => !r.deposited).length,
      ready: this.records.filter(
        (r) => !r.deposited && r.completeEra <= currentEra,
      ).length,
      deposited: this.records.filter((r) => r.deposited).length,
    };
  }
}
