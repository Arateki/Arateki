import type { User, UserRepository } from '../domain/user.js';

interface BootstrapAdminConfig {
  login?: string | undefined;
  password?: string | undefined;
}

export class BootstrapAdminUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(input?: BootstrapAdminConfig): Promise<User | null> {
    if (await this.users.hasAdmin()) return null;

    if (!input?.login || !input.password) {
      throw new Error('ADMIN_LOGIN and ADMIN_PASSWORD are required to create the first admin user.');
    }

    validateInitialPassword(input.password);

    return this.users.ensureAdmin({
      login: input.login,
      password: input.password,
    });
  }
}

function validateInitialPassword(password: string): void {
  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD must contain at least 12 characters.');
  }
}
