import { describe, expect, it } from 'vitest';
import { PasswordHasher } from '../infrastructure/password-hasher.js';
import { InMemoryUserRepository, makeUser } from '../test/in-memory-repositories.js';
import { ChangePasswordUseCase } from './change-password.js';

describe('ChangePasswordUseCase', () => {
  const passwordHasher = new PasswordHasher();

  async function makeRepository(): Promise<InMemoryUserRepository> {
    return new InMemoryUserRepository([
      makeUser({ id: 'admin-id', login: 'admin', passwordHash: await passwordHasher.hash('current-password') }),
    ]);
  }

  it('updates password and increments token version', async () => {
    const useCase = new ChangePasswordUseCase(await makeRepository());

    await expect(useCase.execute({
      userId: 'admin-id',
      currentPassword: 'current-password',
      newPassword: 'new-password-value',
    })).resolves.toMatchObject({
      tokenVersion: 1,
    });
  });

  it('rejects invalid current password', async () => {
    const useCase = new ChangePasswordUseCase(await makeRepository());

    await expect(useCase.execute({
      userId: 'admin-id',
      currentPassword: 'wrong-password',
      newPassword: 'new-password-value',
    })).resolves.toBeNull();
  });
});
