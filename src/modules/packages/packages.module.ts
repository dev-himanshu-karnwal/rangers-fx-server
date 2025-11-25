import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackagesController } from './packages.controller';
import { PackagesService } from './packages.service';
import { UserPackageService } from './services';
import { Package, UserPackage } from './entities';
import { Wallet } from '../wallets/entities/wallet.entity';
import { WalletModule } from '../wallets/wallet.module';
import { TransactionModule } from '../transactions/transaction.module';
import { BotsModule } from '../bots/bots.module';

@Module({
  imports: [TypeOrmModule.forFeature([Package, UserPackage, Wallet]), WalletModule, TransactionModule, BotsModule],
  controllers: [PackagesController],
  providers: [PackagesService, UserPackageService],
})
export class PackagesModule {}
