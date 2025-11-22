import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get port(): number {
    return this.configService.get<number>('PORT', 5000);
  }

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get dbHost(): string {
    return this.configService.get<string>('DB_HOST', 'localhost');
  }

  get dbPort(): number {
    return this.configService.get<number>('DB_PORT', 5432);
  }

  get dbUsername(): string {
    return this.configService.get<string>('DB_USERNAME', 'postgres');
  }

  get dbPassword(): string {
    return this.configService.get<string>('DB_PASSWORD', 'postgres');
  }

  get dbName(): string {
    return this.configService.get<string>('DB_NAME', 'rangers_fx');
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get smtpHost(): string {
    return this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com');
  }

  get smtpPort(): number {
    return this.configService.get<number>('SMTP_PORT', 587);
  }

  get smtpSecure(): boolean {
    return this.configService.get<boolean>('SMTP_SECURE', false);
  }

  get smtpUser(): string {
    return this.configService.get<string>('SMTP_USER', '');
  }

  get smtpPassword(): string {
    return this.configService.get<string>('SMTP_PASSWORD', '');
  }

  get smtpFromEmail(): string {
    return this.configService.get<string>('SMTP_FROM_EMAIL', 'noreply@rangersfx.com');
  }

  get smtpFromName(): string {
    return this.configService.get<string>('SMTP_FROM_NAME', 'Rangers FX');
  }

  get appUrl(): string {
    return this.configService.get<string>('APP_URL', 'http://localhost:3000');
  }

  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET', 'your-secret-key-change-in-production');
  }

  get jwtExpiresIn(): string {
    return this.configService.get<string>('JWT_EXPIRES_IN', '2d');
  }
}
