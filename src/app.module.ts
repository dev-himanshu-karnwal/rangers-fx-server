import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { WalletModule } from './modules/wallets/wallet.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { EmailModule } from './core/services/email/email.module';
import { TransactionModule } from './modules/transactions/transaction.module';
import { BotsModule } from './modules/bots/bots.module';
import { PackagesModule } from './modules/packages/packages.module';
import { LevelsModule } from './modules/levels/levels.module';
import path from 'path';
import fs from 'fs';

@Module({
  imports: [
    ConfigModule,
    EmailModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.databaseUrl;
        // Check if this is a DigitalOcean managed database (doadmin user) or remote database
        const isRemoteDatabase =
          databaseUrl.includes('@') && !databaseUrl.includes('localhost') && !databaseUrl.includes('127.0.0.1');
        const requiresSSL = configService.isProduction || databaseUrl.includes('doadmin') || isRemoteDatabase;
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
              rejectUnauthorized: configService.isProduction,
            };
          }
        }

        return {
          type: 'postgres',
          url: databaseUrl,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: configService.isDevelopment,
          migrationsRun: configService.isProduction,
          migrations: [__dirname + '/database/migrations/**/*.ts'],
          logging: false,
          ssl: sslConfig,
        };
      },
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    WalletModule,
    TransactionModule,
    BotsModule,
    PackagesModule,
    LevelsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
