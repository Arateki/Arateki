import { describe, expect, it } from 'vitest';
import { InMemoryUserRepository, makeUser } from '../test/in-memory-repositories.js';
import { BootstrapAdminUseCase } from './bootstrap-admin.js';

describe('BootstrapAdminUseCase', () => {
  it('does nothing when an admin already exists', async () => {
    const repository = new InMemoryUserRepository([makeUser({ role: 'admin' })]);
    const useCase = new BootstrapAdminUseCase(repository);

    await expect(useCase.execute()).resolves.toBeNull();
    expect(repository.users).toHaveLength(1);
  });

  it('requires credentials when there is no admin', async () => {
    const useCase = new BootstrapAdminUseCase(new InMemoryUserRepository());

    await expect(useCase.execute()).rejects.toThrow('ADMIN_LOGIN and ADMIN_PASSWORD');
  });

  it('creates the first admin with a strong enough password', async () => {
    const repository = new InMemoryUserRepository();
    const useCase = new BootstrapAdminUseCase(repository);

    await expect(useCase.execute({
      login: 'admin',
      password: 'strong-password',
    })).resolves.toMatchObject({
      login: 'admin',
      role: 'admin',
    });
    expect(await repository.hasAdmin()).toBe(true);
  });

  it('rejects weak initial passwords', async () => {
    const useCase = new BootstrapAdminUseCase(new InMemoryUserRepository());

    await expect(useCase.execute({
      login: 'admin',
      password: 'short',
    })).rejects.toThrow('at least 12 characters');
  });
});
