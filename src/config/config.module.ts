import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service';

@Module({
  imports: [
    NestConfigModule.forRoot({
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
      isGlobal: true,
      cache: false,
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
