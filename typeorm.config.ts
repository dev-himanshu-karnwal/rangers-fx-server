import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config({ path: '.env.production' });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}
const isRemoteDatabase =
  databaseUrl.includes('@') && !databaseUrl.includes('localhost') && !databaseUrl.includes('127.0.0.1');
const requiresSSL = process.env.NODE_ENV === 'production' || databaseUrl.includes('doadmin') || isRemoteDatabase;
let sslConfig: any = false;
if (requiresSSL) {
  const certPath = path.join(process.cwd(), 'certs/cert.crt');
  if (fs.existsSync(certPath)) {
    sslConfig = {
      ca: fs.readFileSync(certPath, 'utf-8').toString(),
    };
  } else {
    // If cert file doesn't exist, use rejectUnauthorized: false for development
    // In production, you should always have the cert file
    sslConfig = {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    };
  }
}

export default new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['/database/migrations/**/*.ts'],
  migrationsRun: process.env.NODE_ENV === 'production',
  synchronize: process.env.NODE_ENV === 'development',
  ssl:
    process.env.NODE_ENV === 'production'
      ? {
          ca: fs.readFileSync(path.join(process.cwd(), 'certs/cert.crt'), 'utf-8').toString(),
        }
      : false,
});
