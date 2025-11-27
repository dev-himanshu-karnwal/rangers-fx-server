import { Module, forwardRef } from '@nestjs/common';
import { IncomeService } from './income.service';
import { BotIncomeService, PassiveIncomeService, TradingIncomeService, AppraisalIncomeService } from './services';
import { PackagesModule } from '../packages/packages.module';
import { BotsModule } from '../bots/bots.module';
import { UserModule } from '../user/user.module';
import { WalletModule } from '../wallets/wallet.module';
import { TransactionModule } from '../transactions/transaction.module';
import { LevelsModule } from '../levels/levels.module';
import { ClosureModule } from '../user/closure/closure.module';

@Module({
  imports: [
    forwardRef(() => PackagesModule),
    BotsModule,
    UserModule,
    WalletModule,
    TransactionModule,
    LevelsModule,
    ClosureModule,
  ],
  providers: [IncomeService, BotIncomeService, PassiveIncomeService, TradingIncomeService, AppraisalIncomeService],
  exports: [IncomeService, BotIncomeService, PassiveIncomeService],
})
export class IncomeModule {}
