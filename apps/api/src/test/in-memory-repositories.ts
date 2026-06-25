/**
 * Fakes in-memory das portas de domínio, reutilizáveis por qualquer teste de
 * lógica de negócio (use-cases) sem amarrar a uma tecnologia de persistência.
 *
 * Os testes que verificam uma implementação concreta (ex.: `node:sqlite`)
 * continuam em `infrastructure/sqlite/*.test.ts`. Estes fakes servem ao oposto:
 * exercitar regras de negócio de forma agnóstica ao banco.
 */
import { randomUUID } from 'node:crypto';
import type { AuditLog, AuditLogInput, AuditLogRepository } from '../domain/audit-log.js';
import type { Order, OrderRepository, OrderStatus } from '../domain/order.js';
import type { Product, ProductInput, ProductRepository } from '../domain/product.js';
import type { RevokedToken, RevokedTokenRepository } from '../domain/revoked-token.js';
import type { TransactionRunner } from '../domain/transaction.js';
import type { BootstrapAdminInput, User, UserRepository } from '../domain/user.js';

export class InMemoryProductRepository implements ProductRepository {
  readonly products: Product[];

  constructor(seed: Product[] = []) {
    this.products = seed.map(clone);
  }

  listActive(): Promise<Product[]> {
    return Promise.resolve(this.products.filter(product => product.active).map(clone));
  }

  listAll(): Promise<Product[]> {
    return Promise.resolve(this.products.map(clone));
  }

  findById(id: string): Promise<Product | null> {
    const found = this.products.find(product => product.id === id);
    return Promise.resolve(found ? clone(found) : null);
  }

  findActiveById(id: string): Promise<Product | null> {
    const found = this.products.find(product => product.id === id && product.active);
    return Promise.resolve(found ? clone(found) : null);
  }

  create(input: ProductInput): Promise<Product> {
    const now = new Date();
    const product: Product = {
      id: randomUUID(),
      name: input.name,
      description: input.description,
      imageUrl: input.imageUrl,
      variants: input.variants.map(variant => ({
        id: variant.id ?? randomUUID(),
        sku: variant.sku,
        attributes: variant.attributes,
        prices: variant.prices,
        stock: variant.stock,
        active: variant.active ?? true,
      })),
      active: input.active ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.products.push(product);
    return Promise.resolve(clone(product));
  }

  update(id: string, input: ProductInput): Promise<Product | null> {
    const existing = this.products.find(product => product.id === id);
    if (!existing) return Promise.resolve(null);
    existing.name = input.name;
    existing.description = input.description;
    existing.imageUrl = input.imageUrl;
    existing.variants = input.variants.map(variant => ({
      id: variant.id ?? randomUUID(),
      sku: variant.sku,
      attributes: variant.attributes,
      prices: variant.prices,
      stock: variant.stock,
      active: variant.active ?? true,
    }));
    existing.active = input.active ?? existing.active;
    existing.updatedAt = new Date();
    return Promise.resolve(clone(existing));
  }

  seedIfEmpty(products: Product[]): Promise<void> {
    if (this.products.length === 0) this.products.push(...products.map(clone));
    return Promise.resolve();
  }

  decrementStock(productId: string, variantId: string, quantity: number): Promise<void> {
    const product = this.products.find(item => item.id === productId);
    const variant = product?.variants.find(item => item.id === variantId);
    if (!variant || variant.stock < quantity) {
      throw new Error('INSUFFICIENT_STOCK_OR_NOT_FOUND');
    }
    variant.stock -= quantity;
    return Promise.resolve();
  }
}

export class InMemoryOrderRepository implements OrderRepository {
  readonly orders: Order[] = [];

  create(order: Order): Promise<Order> {
    this.orders.push(clone(order));
    return Promise.resolve(order);
  }

  findById(id: string): Promise<Order | null> {
    const found = this.orders.find(order => order.id === id);
    return Promise.resolve(found ? clone(found) : null);
  }

  listAll(): Promise<Order[]> {
    return Promise.resolve(
      [...this.orders].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).map(clone),
    );
  }

  updateStatus(id: string, status: OrderStatus): Promise<boolean> {
    const existing = this.orders.find(order => order.id === id);
    if (!existing) return Promise.resolve(false);
    existing.status = status;
    existing.updatedAt = new Date();
    return Promise.resolve(true);
  }
}

export class InMemoryUserRepository implements UserRepository {
  readonly users: User[];

  constructor(seed: User[] = []) {
    this.users = seed.map(clone);
  }

  findByLogin(login: string): Promise<User | null> {
    const found = this.users.find(user => user.login === login);
    return Promise.resolve(found ? clone(found) : null);
  }

  findById(id: string): Promise<User | null> {
    const found = this.users.find(user => user.id === id);
    return Promise.resolve(found ? clone(found) : null);
  }

  hasAdmin(): Promise<boolean> {
    return Promise.resolve(this.users.some(user => user.role === 'admin'));
  }

  ensureAdmin(input: BootstrapAdminInput): Promise<User> {
    const existing = this.users.find(user => user.role === 'admin');
    if (existing) return Promise.resolve(clone(existing));
    const now = new Date();
    const user: User = {
      id: randomUUID(),
      login: input.login,
      passwordHash: `hashed:${input.password}`,
      role: 'admin',
      tokenVersion: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.users.push(user);
    return Promise.resolve(clone(user));
  }

  updatePassword(id: string, passwordHash: string): Promise<User | null> {
    const existing = this.users.find(user => user.id === id);
    if (!existing) return Promise.resolve(null);
    existing.passwordHash = passwordHash;
    existing.tokenVersion += 1;
    existing.updatedAt = new Date();
    return Promise.resolve(clone(existing));
  }
}

export class InMemoryAuditLogRepository implements AuditLogRepository {
  readonly records: AuditLog[] = [];

  record(input: AuditLogInput): Promise<void> {
    this.records.push({ id: randomUUID(), ...input, at: new Date() });
    return Promise.resolve();
  }

  findLast(action: AuditLog['action'], entityId: string): AuditLog | null {
    for (let index = this.records.length - 1; index >= 0; index -= 1) {
      const entry = this.records[index];
      if (entry && entry.action === action && entry.entityId === entityId) return entry;
    }
    return null;
  }
}

export class InMemoryRevokedTokenRepository implements RevokedTokenRepository {
  private readonly tokens = new Map<string, Date>();

  revoke(input: RevokedToken): Promise<void> {
    if (!this.tokens.has(input.id)) this.tokens.set(input.id, input.expiresAt);
    return Promise.resolve();
  }

  isRevoked(id: string): Promise<boolean> {
    return Promise.resolve(this.tokens.has(id));
  }

  purgeExpired(now: Date = new Date()): Promise<number> {
    let removed = 0;
    for (const [id, expiresAt] of this.tokens) {
      if (expiresAt < now) {
        this.tokens.delete(id);
        removed += 1;
      }
    }
    return Promise.resolve(removed);
  }
}

/** Executa o trabalho imediatamente; cobre o caminho feliz dos use-cases. */
export class ImmediateTransactionRunner implements TransactionRunner {
  run<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }
}

export function makeUser(overrides: Partial<User> = {}): User {
  const now = new Date();
  return {
    id: 'user-id',
    login: 'admin',
    passwordHash: 'hash',
    role: 'admin',
    tokenVersion: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function clone<T>(value: T): T {
  return structuredClone(value);
}
