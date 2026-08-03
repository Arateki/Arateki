export type UserRole = 'admin';

export interface User {
  id: string;
  login: string;
  passwordHash: string;
  role: UserRole;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BootstrapAdminInput {
  login: string;
  password: string;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByLogin(login: string): Promise<User | null>;
  hasAdmin(): Promise<boolean>;
  ensureAdmin(input: BootstrapAdminInput): Promise<User>;
  updatePassword(id: string, passwordHash: string): Promise<User | null>;
}
