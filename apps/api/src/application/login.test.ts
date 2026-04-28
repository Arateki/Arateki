import { describe, expect, it } from 'vitest';
import type { User, UserRepository } from '../domain/user.js';
import { PasswordHasher } from '../infrastructure/password-hasher.js';
import { LoginUseCase } from './login.js';

describe('LoginUseCase', () => {
  const passwordHasher = new PasswordHasher();

  it('accepts configured admin credentials', async () => {
    const useCase = new LoginUseCase(new InMemoryUserRepository({
      passwordHash: await passwordHasher.hash('admin-password'),
    }));

    await expect(useCase.execute({
      login: 'admin',
      password: 'admin-password',
    })).resolves.toMatchObject({
      id: 'admin-id',
      login: 'admin',
      role: 'admin',
    });
  });

  it('rejects invalid credentials', async () => {
    const useCase = new LoginUseCase(new InMemoryUserRepository({
      passwordHash: await passwordHasher.hash('admin-password'),
    }));

    await expect(useCase.execute({
      login: 'admin',
      password: 'wrong-password',
    })).resolves.toBeNull();
  });
});

class InMemoryUserRepository implements UserRepository {
  private readonly user: User;

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

  findByLogin(login: string): Promise<User | null> {
    return Promise.resolve(login === this.user.login ? this.user : null);
  }

  findById(id: string): Promise<User | null> {
    return Promise.resolve(id === this.user.id ? this.user : null);
  }

  hasAdmin(): Promise<boolean> {
    return Promise.resolve(true);
  }

  ensureAdmin(): Promise<User> {
    return Promise.resolve(this.user);
  }

  updatePassword(): Promise<User | null> {
    return Promise.resolve(this.user);
  }

  ensureIndexes(): Promise<void> {
    return Promise.resolve();
  }
}
