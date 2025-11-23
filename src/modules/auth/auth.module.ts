import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserModule } from '../user/user.module';
import { OtpModule } from '../otp/otp.module';
import { ClosureModule } from '../user/closure/closure.module';
import { User } from '../user/entities/user.entity';
import { ConfigModule } from '../../config/config.module';
import { ConfigService } from '../../config/config.service';
import { EmailModule } from '../../core/services/email/email.module';
import { AUTH_CONSTANTS } from './constants/auth.constants';

/**
 * Auth module - handles authentication and authorization
 * Imports UserModule to access UserService
 * Exports AuthService and JwtStrategy for use in other modules
 */
@Module({
  imports: [
    UserModule, // Import UserModule to access UserService and ReferralService
    OtpModule, // Import OtpModule to access OtpService
    ClosureModule, // Import ClosureModule to access UserClosureService
    TypeOrmModule.forFeature([User]), // Import User entity for direct repository access
    ConfigModule, // Import ConfigModule to access ConfigService
    EmailModule, // Import EmailModule to access EmailService
    PassportModule.register({ defaultStrategy: AUTH_CONSTANTS.DEFAULT_STRATEGY }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const expiresIn = configService.jwtExpiresIn;
        return {
          secret: configService.jwtSecret,
          signOptions: {
            expiresIn,
          },
        } as any;
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy], // Export for use in other modules
})
export class AuthModule {}
