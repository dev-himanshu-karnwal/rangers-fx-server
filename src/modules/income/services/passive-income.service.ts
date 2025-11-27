import { Injectable } from '@nestjs/common';
import { User } from 'src/modules/user/entities/user.entity';
import { Package } from 'src/modules/packages/entities/package.entity';
import { UserPackage } from 'src/modules/packages/entities/user-package.entity';
import { Wallet } from 'src/modules/wallets/entities/wallet.entity';
import { WalletService } from 'src/modules/wallets/wallet.service';
import { TransactionService } from 'src/modules/transactions/transaction.service';
import { TransactionStatus, TransactionType } from 'src/modules/transactions/enums';
import { INCOME_CONSTANTS } from '../constants/income.constants';

/**
 * Passive Income Service - Handles all passive income calculation logic and package purchase transactions
 * Follows Single Responsibility Principle - handles passive income calculations and purchase transaction distribution
 */
@Injectable()
export class PassiveIncomeService {
  constructor(
    private readonly walletService: WalletService,
    private readonly transactionService: TransactionService,
  ) {}

  /**
   * Handles package purchase transaction with 93% to company and 7% to upline distribution
   * @param user - User purchasing the package
   * @param pkg - Package being purchased
   * @param userPackage - Created user package entity
   * @param userWallet - User's wallet
   * @param companyIncomeWallet - Company income wallet
   * @param investmentAmount - Investment amount
   */
  async handlePackagePurchaseTransaction(
    user: User,
    pkg: Package,
    userPackage: UserPackage,
    userWallet: Wallet,
    companyIncomeWallet: Wallet,
    investmentAmount: number,
  ): Promise<void> {
    // Calculate allocation amounts
    const companyAmount = investmentAmount * INCOME_CONSTANTS.COMPANY_ALLOCATION_PERCENTAGE;
    const uplineAmount = investmentAmount * INCOME_CONSTANTS.UPLINE_ALLOCATION_PERCENTAGE;

    // Transfer 93% to company wallet
    await this.walletService.transferBetweenWallets(userWallet, companyIncomeWallet, companyAmount);

    // Create transaction record for company transfer
    await this.transactionService.createTransaction({
      fromWalletId: userWallet.id,
      toWalletId: companyIncomeWallet.id,
      amount: companyAmount,
      description: `Purchase of package ${pkg.title} by ${user.fullName} - Company allocation (93%)`,
      type: TransactionType.PURCHASE_PACKAGE,
      status: TransactionStatus.APPROVED,
      entityId: userPackage.id,
      initiator: user,
      statusUpdatedAt: new Date(),
      statusUpdatedBy: user.id,
      statusUpdater: user,
    });

    // Distribute 7% to upline (placeholder - will be implemented later)
    await this.distributeUplineAllocation(user, pkg, userPackage, userWallet, uplineAmount);
  }

  /**
   * Distributes the 7% allocation among upline users
   * TODO: Implement the complex distribution logic
   * @param user - User purchasing the package
   * @param pkg - Package being purchased
   * @param userPackage - Created user package entity
   * @param userWallet - User's wallet
   * @param uplineAmount - Total amount to distribute (7% of investment)
   */
  private async distributeUplineAllocation(
    user: User,
    pkg: Package,
    userPackage: UserPackage,
    userWallet: Wallet,
    uplineAmount: number,
  ): Promise<void> {
    // TODO: Implement complex upline distribution logic
    // For now, this is a placeholder
    // The distribution logic will be added later based on business rules
  }

  /**
   * Calculates passive income for a user
   * @param userId - User ID
   * @returns Passive income amount
   */
  async calculatePassiveIncome(userId: number): Promise<number> {
    // TODO: Implement passive income calculation logic
    return 0;
  }

  /**
   * Gets total passive income for a user
   * @param userId - User ID
   * @returns Total passive income amount
   */
  async getTotalPassiveIncome(userId: number): Promise<number> {
    // TODO: Implement total passive income retrieval logic
    return 0;
  }
}
