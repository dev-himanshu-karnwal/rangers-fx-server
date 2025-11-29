import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { Transaction } from './entities/transaction.entity';
import { WalletModule } from '../wallets/wallet.module';

/**
 * Transaction module - handles transaction-related operations
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    WalletModule, // Import WalletModule to access WalletService
  ],
  controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TransactionService], // Export for use in other modules
})
export class TransactionModule {}
