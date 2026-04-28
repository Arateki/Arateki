import { describe, expect, it } from 'vitest';
import type { User, UserRepository } from '../domain/user.js';
import { PasswordHasher } from '../infrastructure/password-hasher.js';
import { ChangePasswordUseCase } from './change-password.js';

describe('ChangePasswordUseCase', () => {
  const passwordHasher = new PasswordHasher();

  it('updates password and increments token version', async () => {
    const repository = new InMemoryUserRepository({
      passwordHash: await passwordHasher.hash('current-password'),
    });
    const useCase = new ChangePasswordUseCase(repository);

    await expect(useCase.execute({
      userId: 'admin-id',
      currentPassword: 'current-password',
      newPassword: 'new-password-value',
    })).resolves.toMatchObject({
      tokenVersion: 1,
    });
  });

  it('rejects invalid current password', async () => {
    const repository = new InMemoryUserRepository({
      passwordHash: await passwordHasher.hash('current-password'),
    });
    const useCase = new ChangePasswordUseCase(repository);

    await expect(useCase.execute({
      userId: 'admin-id',
      currentPassword: 'wrong-password',
      newPassword: 'new-password-value',
    })).resolves.toBeNull();
  });
});

class InMemoryUserRepository implements UserRepository {
  private user: User;

  constructor(overrides: Partial<User> = {}) {
    const now = new Date();
    this.user = {
      id: 'admin-id',
      login: 'admin',
      passwordHash: 'hash',
      role: 'admin',
      tokenVersion: 0,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

  findById(id: string): Promise<User | null> {
    return Promise.resolve(id === this.user.id ? this.user : null);
  }

  findByLogin(login: string): Promise<User | null> {
    return Promise.resolve(login === this.user.login ? this.user : null);
  }

  hasAdmin(): Promise<boolean> {
    return Promise.resolve(true);
  }

  ensureAdmin(): Promise<User> {
    return Promise.resolve(this.user);
  }

  updatePassword(_id: string, passwordHash: string): Promise<User | null> {
    this.user = {
      ...this.user,
      passwordHash,
      tokenVersion: this.user.tokenVersion + 1,
      updatedAt: new Date(),
    };

    return Promise.resolve(this.user);
  }

  ensureIndexes(): Promise<void> {
    return Promise.resolve();
  }
}
