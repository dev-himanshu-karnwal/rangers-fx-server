import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import {
  UserReferralService,
  UserQueryService,
  UserPasswordService,
  UserEmailService,
  UserSignupService,
  UserVerificationService,
  UserResetTokenService,
  UserUpdateService,
} from './services';
import { User } from './entities/user.entity';
import { ClosureModule } from './closure/closure.module';
import { WalletModule } from '../wallets/wallet.module';
import { OtpModule } from '../otp/otp.module';
import { EmailModule } from '../../core/services/email/email.module';
import { ConfigModule } from '../../config/config.module';
import { LevelsModule } from '../levels/levels.module';

/**
 * User module - handles user-related operations
 * Exports UserService and UserReferralService for use in other modules (e.g., AuthModule)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ClosureModule, // Import ClosureModule to access UserClosureService
    forwardRef(() => WalletModule), // Import WalletModule to access WalletService
    OtpModule,
    EmailModule,
    ConfigModule,
    forwardRef(() => LevelsModule),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserReferralService,
    UserQueryService,
    UserPasswordService,
    UserEmailService,
    UserSignupService,
    UserVerificationService,
    UserResetTokenService,
    UserUpdateService,
  ],
  exports: [UserService, UserReferralService],
})
export class UserModule {}
