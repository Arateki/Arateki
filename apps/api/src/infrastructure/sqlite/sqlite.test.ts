import { openDatabase } from './sqlite.js';

it('creates all tables and applies pragmas', () => {
  const { db, close } = openDatabase(':memory:');
  const tables = db
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name`)
    .all() as Array<{ name: string }>;
  const names = tables.map(t => t.name);

  expect(names).toEqual(
    expect.arrayContaining(['products', 'orders', 'users', 'audit_logs', 'revoked_tokens']),
  );

  const busyRow = db.prepare('PRAGMA busy_timeout').get() as Record<string, number>;
  expect(Object.values(busyRow)[0]).toBe(5000);
  close();
});
