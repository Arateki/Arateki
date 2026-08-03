import { openDatabase, type SqliteConnection } from './sqlite.js';
import { SqliteUserRepository } from './sqlite-user-repository.js';

let conn: SqliteConnection;
let repo: SqliteUserRepository;
beforeEach(() => { conn = openDatabase(':memory:'); repo = new SqliteUserRepository(conn.db); });
afterEach(() => conn.close());

it('ensureAdmin creates once and is idempotent', async () => {
  const a = await repo.ensureAdmin({ login: 'admin', password: 'a-very-long-pass' });
  const b = await repo.ensureAdmin({ login: 'admin', password: 'a-very-long-pass' });
  expect(a.id).toBe(b.id);
  expect(await repo.hasAdmin()).toBe(true);
});

it('finds by login and id with Date instances', async () => {
  const created = await repo.ensureAdmin({ login: 'admin', password: 'a-very-long-pass' });
  const byLogin = await repo.findByLogin('admin');
  const byId = await repo.findById(created.id);
  expect(byLogin?.id).toBe(created.id);
  expect(byId?.createdAt).toBeInstanceOf(Date);
});

it('updatePassword bumps tokenVersion', async () => {
  const created = await repo.ensureAdmin({ login: 'admin', password: 'a-very-long-pass' });
  const updated = await repo.updatePassword(created.id, 'new-hash');
  expect(updated?.passwordHash).toBe('new-hash');
  expect(updated?.tokenVersion).toBe(created.tokenVersion + 1);
});
