import type { User, UserRepository } from '../domain/user.js';
import { PasswordHasher } from '../infrastructure/password-hasher.js';

export interface LoginInput {
  login: string;
  password: string;
}

export class LoginUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher = new PasswordHasher(),
  ) {}

  async execute(input: LoginInput): Promise<User | null> {
    const user = await this.users.findByLogin(input.login);
    if (!user || user.role !== 'admin') return null;

    const validPassword = await this.passwordHasher.verify(input.password, user.passwordHash);
    return validPassword ? user : null;
  }
}
