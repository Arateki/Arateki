import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { BootstrapAdminInput, User, UserRepository } from '../../domain/user.js';
import { PasswordHasher } from '../password-hasher.js';

interface UserRow { doc: string }

export class SqliteUserRepository implements UserRepository {
  constructor(
    private readonly db: DatabaseSync,
    private readonly passwordHasher = new PasswordHasher(),
  ) {}

  async findByLogin(login: string): Promise<User | null> {
    const row = this.db.prepare(`SELECT doc FROM users WHERE login = ?`).get(login) as UserRow | undefined;
    return row ? rowToUser(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const row = this.db.prepare(`SELECT doc FROM users WHERE id = ?`).get(id) as UserRow | undefined;
    return row ? rowToUser(row) : null;
  }

  async hasAdmin(): Promise<boolean> {
    const row = this.db.prepare(`SELECT 1 FROM users WHERE json_extract(doc, '$.role') = 'admin' LIMIT 1`).get();
    return row !== undefined;
  }

  async ensureAdmin(input: BootstrapAdminInput): Promise<User> {
    const existing = this.db
      .prepare(`SELECT doc FROM users WHERE json_extract(doc, '$.role') = 'admin' LIMIT 1`)
      .get() as UserRow | undefined;
    if (existing) return rowToUser(existing);

    const now = new Date();
    const user: User = {
      id: randomUUID(),
      login: input.login,
      passwordHash: await this.passwordHasher.hash(input.password),
      role: 'admin',
      tokenVersion: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.db.prepare(`INSERT INTO users (id, doc, login) VALUES (?, ?, ?)`).run(user.id, JSON.stringify(user), user.login);
    return user;
  }

  async updatePassword(id: string, passwordHash: string): Promise<User | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated: User = {
      ...existing,
      passwordHash,
      tokenVersion: existing.tokenVersion + 1,
      updatedAt: new Date(),
    };
    this.db.prepare(`UPDATE users SET doc = ? WHERE id = ?`).run(JSON.stringify(updated), id);
    return updated;
  }

  async ensureIndexes(): Promise<void> {
    // login UNIQUE garantido pelo schema; método mantido por compatibilidade da interface
  }
}

function rowToUser(row: UserRow): User {
  const parsed = JSON.parse(row.doc) as User;
  return { ...parsed, createdAt: new Date(parsed.createdAt), updatedAt: new Date(parsed.updatedAt) };
}
