import type { DatabaseSync } from 'node:sqlite';
import type { TransactionRunner } from '../../domain/transaction.js';

export class SqliteTransactionRunner implements TransactionRunner {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly db: DatabaseSync) {}

  run<T>(work: () => Promise<T>): Promise<T> {
    const result = this.queue.then(async () => {
      this.db.exec('BEGIN IMMEDIATE');
      try {
        const value = await work();
        this.db.exec('COMMIT');
        return value;
      } catch (error) {
        this.db.exec('ROLLBACK');
        throw error;
      }
    });
    this.queue = result.catch(() => undefined);
    return result as Promise<T>;
  }
}
