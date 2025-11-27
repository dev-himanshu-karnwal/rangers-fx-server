import { Module, forwardRef } from '@nestjs/common';
import { IncomeService } from './income.service';
import { BotIncomeService, PassiveIncomeService, TradingIncomeService, AppraisalIncomeService } from './services';
import { PackagesModule } from '../packages/packages.module';
import { BotsModule } from '../bots/bots.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [forwardRef(() => PackagesModule), BotsModule, UserModule],
  providers: [IncomeService, BotIncomeService, PassiveIncomeService, TradingIncomeService, AppraisalIncomeService],
  exports: [IncomeService, BotIncomeService],
})
export class IncomeModule {}
