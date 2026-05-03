import type { User, UserRepository } from '../domain/user.js';
import type { AuditLogRepository } from '../domain/audit-log.js';
import { PasswordHasher } from '../infrastructure/password-hasher.js';

export interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export class ChangePasswordUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher = new PasswordHasher(),
    private readonly auditLogs?: AuditLogRepository,
  ) {}

  async execute(input: ChangePasswordInput): Promise<User | null> {
    validateNewPassword(input.newPassword);

    const user = await this.users.findById(input.userId);
    if (!user) return null;

    const validCurrentPassword = await this.passwordHasher.verify(
      input.currentPassword,
      user.passwordHash,
    );
    if (!validCurrentPassword) return null;

    const updatedUser = await this.users.updatePassword(
      input.userId,
      await this.passwordHasher.hash(input.newPassword),
    );

    if (updatedUser && this.auditLogs) {
      await this.auditLogs.record({
        userId: input.userId,
        action: 'user.password.change',
        entityType: 'user',
        entityId: input.userId,
        before: {
          tokenVersion: user.tokenVersion,
        },
        after: {
          tokenVersion: updatedUser.tokenVersion,
        },
      });
    }

    return updatedUser;
  }
}

export function validateNewPassword(password: string): void {
  if (password.length < 12) {
    throw new Error('Password must contain at least 12 characters.');
  }
}
