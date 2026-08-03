import { DatabaseSync } from 'node:sqlite';
import { SCHEMA_SQL } from './schema.js';

export interface SqliteConnection {
  db: DatabaseSync;
  close(): void;
}

export function openDatabase(path: string): SqliteConnection {
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA synchronous = NORMAL');
  db.exec('PRAGMA busy_timeout = 5000');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(SCHEMA_SQL);
  return { db, close: () => db.close() };
}
