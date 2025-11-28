import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config({ path: '.env.production' });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const isProduction = process.env.NODE_ENV === 'production';
const requiresSSL = isProduction || databaseUrl.includes('doadmin');

let sslConfig: any = false;
if (requiresSSL) {
  const certPath = path.join(process.cwd(), 'certs/cert.crt');
  if (fs.existsSync(certPath)) {
    sslConfig = {
      ca: fs.readFileSync(certPath, 'utf-8').toString(),
    };
  } else {
    sslConfig = isProduction
      ? {
          rejectUnauthorized: false,
        }
      : false;
  }
}

export default new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['/database/migrations/**/*.ts'],
  migrationsRun: false,
  synchronize: !isProduction,
  ssl: sslConfig,
});
