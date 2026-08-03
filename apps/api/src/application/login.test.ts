import { describe, expect, it } from 'vitest';
import { PasswordHasher } from '../infrastructure/password-hasher.js';
import { InMemoryUserRepository, makeUser } from '../test/in-memory-repositories.js';
import { LoginUseCase } from './login.js';

describe('LoginUseCase', () => {
  const passwordHasher = new PasswordHasher();

  async function makeRepository(): Promise<InMemoryUserRepository> {
    return new InMemoryUserRepository([
      makeUser({ id: 'admin-id', login: 'admin', passwordHash: await passwordHasher.hash('admin-password') }),
    ]);
  }

  it('accepts configured admin credentials', async () => {
    const useCase = new LoginUseCase(await makeRepository());

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
    const useCase = new LoginUseCase(await makeRepository());

    await expect(useCase.execute({
      login: 'admin',
      password: 'wrong-password',
    })).resolves.toBeNull();
  });
});
