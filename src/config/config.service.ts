import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get port(): number {
    return Number(this.configService.get<string>('PORT', '5000'));
  }

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get databaseUrl(): string {
    console.log(
      'DATABASE_URL',
      this.configService.get<string>('DATABASE_URL', 'postgres://postgres:postgres@localhost:5432/rangers_fx'),
    );
    return this.configService.get<string>('DATABASE_URL', 'postgres://postgres:postgres@localhost:5432/rangers_fx');
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
    return Number(this.configService.get<string>('SMTP_PORT', '587'));
  }

  get smtpSecure(): boolean {
    return this.configService.get<string>('SMTP_SECURE', 'false') === 'false' ? false : true;
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

  get authTokenCookieKey(): string {
    return this.configService.get<string>('AUTH_TOKEN_COOKIE_KEY', 'access_token');
  }

  get cookieMaxAge(): number {
    const maxAge = this.configService.get<string>('COOKIE_MAX_AGE');
    if (maxAge) {
      const parsed = Number(maxAge);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    // Default: 2 days in milliseconds
    return 172800000;
  }
}
