import { openDatabase, type SqliteConnection } from './sqlite.js';
import { SqliteRevokedTokenRepository } from './sqlite-revoked-token-repository.js';

let conn: SqliteConnection;
let repo: SqliteRevokedTokenRepository;
beforeEach(() => { conn = openDatabase(':memory:'); repo = new SqliteRevokedTokenRepository(conn.db); });
afterEach(() => conn.close());

it('revoke is idempotent and isRevoked detects it', async () => {
  await repo.revoke({ id: 'jti-1', expiresAt: new Date(Date.now() + 60_000), createdAt: new Date() });
  await repo.revoke({ id: 'jti-1', expiresAt: new Date(Date.now() + 60_000), createdAt: new Date() });
  expect(await repo.isRevoked('jti-1')).toBe(true);
  expect(await repo.isRevoked('jti-2')).toBe(false);
});

it('purgeExpired removes only expired tokens', async () => {
  await repo.revoke({ id: 'old', expiresAt: new Date('2020-01-01'), createdAt: new Date() });
  await repo.revoke({ id: 'fresh', expiresAt: new Date(Date.now() + 60_000), createdAt: new Date() });
  expect(repo.purgeExpired()).toBe(1);
  expect(await repo.isRevoked('old')).toBe(false);
  expect(await repo.isRevoked('fresh')).toBe(true);
});
