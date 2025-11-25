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

@Module({
  imports: [
    ConfigModule,
    EmailModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.dbHost,
        port: configService.dbPort,
        username: configService.dbUsername,
        password: configService.dbPassword,
        database: configService.dbName,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.isDevelopment,
        logging: false,
      }),
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    WalletModule,
    TransactionModule,
    BotsModule,
    PackagesModule,
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
