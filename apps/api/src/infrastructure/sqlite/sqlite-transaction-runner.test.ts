import { openDatabase, type SqliteConnection } from './sqlite.js';
import { SqliteTransactionRunner } from './sqlite-transaction-runner.js';

let conn: SqliteConnection;
let runner: SqliteTransactionRunner;
beforeEach(() => {
  conn = openDatabase(':memory:');
  conn.db.exec(`CREATE TABLE t (id INTEGER PRIMARY KEY, v INTEGER)`);
  runner = new SqliteTransactionRunner(conn.db);
});
afterEach(() => conn.close());

it('commits successful work', async () => {
  await runner.run(async () => { conn.db.prepare(`INSERT INTO t (v) VALUES (1)`).run(); });
  const count = (conn.db.prepare(`SELECT COUNT(*) AS n FROM t`).get() as { n: number }).n;
  expect(count).toBe(1);
});

it('rolls back on error', async () => {
  await expect(runner.run(async () => {
    conn.db.prepare(`INSERT INTO t (v) VALUES (1)`).run();
    throw new Error('boom');
  })).rejects.toThrow('boom');
  const count = (conn.db.prepare(`SELECT COUNT(*) AS n FROM t`).get() as { n: number }).n;
  expect(count).toBe(0);
});

it('serializes concurrent transactions without nesting errors', async () => {
  await Promise.all([
    runner.run(async () => { conn.db.prepare(`INSERT INTO t (v) VALUES (1)`).run(); }),
    runner.run(async () => { conn.db.prepare(`INSERT INTO t (v) VALUES (2)`).run(); }),
  ]);
  const count = (conn.db.prepare(`SELECT COUNT(*) AS n FROM t`).get() as { n: number }).n;
  expect(count).toBe(2);
});
