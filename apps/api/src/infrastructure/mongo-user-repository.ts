import { randomUUID } from 'node:crypto';
import type { Collection, Db } from 'mongodb';
import type { BootstrapAdminInput, User, UserRepository } from '../domain/user.js';
import { PasswordHasher } from './password-hasher.js';

interface UserDocument extends Omit<User, 'id'> {
  _id: string;
}

export class MongoUserRepository implements UserRepository {
  private readonly collection: Collection<UserDocument>;

  constructor(
    db: Db,
    private readonly passwordHasher = new PasswordHasher(),
  ) {
    this.collection = db.collection<UserDocument>('users');
  }

  async findByLogin(login: string): Promise<User | null> {
    const document = await this.collection.findOne({ login });
    return document ? toUser(document) : null;
  }

  async findById(id: string): Promise<User | null> {
    const document = await this.collection.findOne({ _id: id });
    return document ? toUser(document) : null;
  }

  async hasAdmin(): Promise<boolean> {
    return (await this.collection.countDocuments({ role: 'admin' }, { limit: 1 })) > 0;
  }

  async ensureIndexes(): Promise<void> {
    await this.collection.createIndex({ login: 1 }, { unique: true });
    await this.collection.createIndex({ role: 1 });
  }

  async ensureAdmin(input: BootstrapAdminInput): Promise<User> {
    const existingAdmin = await this.collection.findOne({ role: 'admin' });
    if (existingAdmin) return toUser(existingAdmin);

    const now = new Date();
    const user: User = {
      id: randomUUID(),
      login: input.login,
      passwordHash: await this.passwordHasher.hash(input.password),
      role: 'admin',
      tokenVersion: 0,
      createdAt: now,
      updatedAt: now,
    };

    await this.collection.insertOne(toDocument(user));
    return user;
  }

  async updatePassword(id: string, passwordHash: string): Promise<User | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          passwordHash,
          updatedAt: new Date(),
        },
        $inc: {
          tokenVersion: 1,
        },
      },
      { returnDocument: 'after' },
    );

    return result ? toUser(result) : null;
  }
}

function toDocument(user: User): UserDocument {
  const { id, ...rest } = user;
  return { _id: id, ...rest };
}

function toUser(document: UserDocument): User {
  const { _id, ...rest } = document;
  return { id: _id, ...rest };
}
