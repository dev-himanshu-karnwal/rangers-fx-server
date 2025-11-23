import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { Wallet } from './entities/wallet.entity';
import { UserModule } from '../user/user.module';

/**
 * Wallet module - handles wallet-related operations
 */
@Module({
  imports: [TypeOrmModule.forFeature([Wallet]), forwardRef(() => UserModule)],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService], // Export for use in other modules
})
export class WalletModule {}
