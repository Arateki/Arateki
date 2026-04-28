import { describe, expect, it } from 'vitest';
import type { BootstrapAdminInput, User, UserRepository } from '../domain/user.js';
import { BootstrapAdminUseCase } from './bootstrap-admin.js';

describe('BootstrapAdminUseCase', () => {
  it('does nothing when an admin already exists', async () => {
    const repository = new InMemoryUserRepository(true);
    const useCase = new BootstrapAdminUseCase(repository);

    await expect(useCase.execute()).resolves.toBeNull();
    expect(repository.createdAdmin).toBeNull();
  });

  it('requires credentials when there is no admin', async () => {
    const repository = new InMemoryUserRepository(false);
    const useCase = new BootstrapAdminUseCase(repository);

    await expect(useCase.execute()).rejects.toThrow('ADMIN_LOGIN and ADMIN_PASSWORD');
  });

  it('creates the first admin with a strong enough password', async () => {
    const repository = new InMemoryUserRepository(false);
    const useCase = new BootstrapAdminUseCase(repository);

    await expect(useCase.execute({
      login: 'admin',
      password: 'strong-password',
    })).resolves.toMatchObject({
      login: 'admin',
      role: 'admin',
    });
  });

  it('rejects weak initial passwords', async () => {
    const repository = new InMemoryUserRepository(false);
    const useCase = new BootstrapAdminUseCase(repository);

    await expect(useCase.execute({
      login: 'admin',
      password: 'short',
    })).rejects.toThrow('at least 12 characters');
  });
});

class InMemoryUserRepository implements UserRepository {
  createdAdmin: User | null = null;

  constructor(private readonly adminExists: boolean) {}

  findByLogin(): Promise<User | null> {
    return Promise.resolve(null);
  }

  findById(): Promise<User | null> {
    return Promise.resolve(null);
  }

  hasAdmin(): Promise<boolean> {
    return Promise.resolve(this.adminExists);
  }

  ensureAdmin(input: BootstrapAdminInput): Promise<User> {
    const now = new Date();
    this.createdAdmin = {
      id: 'admin-id',
      login: input.login,
      passwordHash: 'hash',
      role: 'admin',
      tokenVersion: 0,
      createdAt: now,
      updatedAt: now,
    };

    return Promise.resolve(this.createdAdmin);
  }

  updatePassword(): Promise<User | null> {
    return Promise.resolve(this.createdAdmin);
  }

  ensureIndexes(): Promise<void> {
    return Promise.resolve();
  }
}
