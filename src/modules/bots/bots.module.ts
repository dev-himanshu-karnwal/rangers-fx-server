import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotsController } from './bots.controller';
import { BotsService } from './bots.service';
import { BotActivation } from './entities';
import { WalletModule } from '../wallets/wallet.module';
import { TransactionModule } from '../transactions/transaction.module';
import { UserModule } from '../user/user.module';
import { Transaction } from '../transactions/entities';
import { LevelsModule } from '../levels/levels.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BotActivation, Transaction]),
    WalletModule,
    TransactionModule,
    forwardRef(() => UserModule),
    forwardRef(() => LevelsModule),
  ],
  controllers: [BotsController],
  providers: [BotsService],
  exports: [BotsService], // Export for use in other modules
})
export class BotsModule {}
