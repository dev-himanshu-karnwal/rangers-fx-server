import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ReferralService } from './services/referral.service';
import { User } from './entities/user.entity';
import { ClosureModule } from './closure/closure.module';
import { WalletModule } from '../wallets/wallet.module';

/**
 * User module - handles user-related operations
 * Exports UserService and ReferralService for use in other modules (e.g., AuthModule)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ClosureModule, // Import ClosureModule to access UserClosureService
    forwardRef(() => WalletModule), // Import WalletModule to access WalletService
  ],
  controllers: [UserController],
  providers: [UserService, ReferralService],
  exports: [UserService, ReferralService], // Export for AuthModule
})
export class UserModule {}
