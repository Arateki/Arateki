import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const keyLength = 64;

export class PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = await deriveKey(password, salt, keyLength);
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  async verify(password: string, storedHash: string): Promise<boolean> {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;

    const storedKey = Buffer.from(hash, 'hex');
    const derivedKey = await deriveKey(password, salt, storedKey.length);

    return timingSafeEqual(storedKey, derivedKey);
  }
}

async function deriveKey(password: string, salt: string, length: number): Promise<Buffer> {
  return (await scrypt(password, salt, length)) as Buffer;
}
