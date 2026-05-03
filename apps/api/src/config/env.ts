export interface Env {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  host: string;
  mongodbUri: string;
  jwtSecret: string;
  adminLogin?: string | undefined;
  adminPassword?: string | undefined;
  jwtExpiresIn: string;
  corsOrigin: string[];
}

function readEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function loadEnv(): Env {
  const nodeEnv = (process.env.NODE_ENV ?? 'development') as Env['nodeEnv'];
  const jwtSecret = readEnv('JWT_SECRET', nodeEnv === 'production' ? undefined : 'dev-secret');

  return {
    nodeEnv,
    port: Number(readEnv('PORT', '3333')),
    host: readEnv('HOST', '0.0.0.0'),
    mongodbUri: readEnv('MONGODB_URI', 'mongodb://localhost:27017/arateki'),
    jwtSecret,
    adminLogin: process.env.ADMIN_LOGIN ?? (nodeEnv === 'production' ? undefined : 'admin'),
    adminPassword: process.env.ADMIN_PASSWORD ?? (nodeEnv === 'production' ? undefined : 'admin-password'),
    jwtExpiresIn: readEnv('JWT_EXPIRES_IN', '1h'),
    corsOrigin: process.env.CORS_ORIGIN?.split(',').map(origin => origin.trim()).filter(Boolean) ?? [],
  };
}
