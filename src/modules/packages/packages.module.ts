import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackagesController } from './packages.controller';
import { PackagesService } from './packages.service';
import { UserPackagePostPurchaseService, UserPackageService } from './services';
import { Package, UserPackage } from './entities';
import { Wallet } from '../wallets/entities/wallet.entity';
import { WalletModule } from '../wallets/wallet.module';
import { TransactionModule } from '../transactions/transaction.module';
import { BotsModule } from '../bots/bots.module';
import { UserModule } from '../user/user.module';
import { LevelsModule } from '../levels/levels.module';
import { IncomeModule } from '../income/income.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Package, UserPackage, Wallet]),
    WalletModule,
    TransactionModule,
    BotsModule,
    UserModule,
    LevelsModule,
    forwardRef(() => IncomeModule),
  ],
  controllers: [PackagesController],
  providers: [PackagesService, UserPackageService, UserPackagePostPurchaseService],
  exports: [PackagesService, UserPackageService], // Export for use in other modules if needed
})
export class PackagesModule {}
