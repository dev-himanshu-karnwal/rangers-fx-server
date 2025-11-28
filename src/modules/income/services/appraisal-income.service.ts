import { Injectable } from '@nestjs/common';
import { User } from '../../user/entities/user.entity';
import { WalletService } from '../../wallets/wallet.service';
import { TransactionService } from '../../transactions/transaction.service';
import { TransactionStatus, TransactionType } from '../../transactions/enums';
import { LevelsService } from '../../levels/levels.service';

/**
 * Appraisal Income Service - Handles all appraisal income calculation and distribution logic
 * Follows Single Responsibility Principle - handles appraisal income calculations and distributions only
 */
@Injectable()
export class AppraisalIncomeService {
  constructor(
    private readonly walletService: WalletService,
    private readonly transactionService: TransactionService,
    private readonly levelsService: LevelsService,
  ) {}

  /**
   * Distributes appraisal bonus when a user is promoted
   * Calculates bonus for all levels between current and new level (inclusive of new, exclusive of current)
   * If user jumps from level 1 to level 3, they receive bonuses for level 2 and level 3
   * @param user - User being promoted
   * @param currentHierarchy - Current level hierarchy (0 if no level)
   * @param newHierarchy - New level hierarchy user is promoted to
   */
  async distributeAppraisalBonus(user: User, currentHierarchy: number, newHierarchy: number): Promise<void> {
    if (newHierarchy <= currentHierarchy) {
      return; // No promotion or invalid hierarchy
    }

    // Get all levels between current and new (inclusive of new, exclusive of current)
    const allLevels = await this.levelsService.getAllLevelsOrdered();
    const levelsToReward = allLevels.filter(
      (level) => level.hierarchy > currentHierarchy && level.hierarchy <= newHierarchy,
    );

    if (levelsToReward.length === 0) {
      return; // No levels to reward
    }

    // Calculate total appraisal bonus for all skipped levels
    const totalBonus = levelsToReward.reduce((sum, level) => sum + Number(level.appraisalBonus ?? 0), 0);

    if (totalBonus <= 0) {
      return; // No bonus to distribute
    }

    // Get wallets
    const companyInvestmentWalletResponse = await this.walletService.getCompanyInvestmentWallet();
    const companyInvestmentWallet = companyInvestmentWalletResponse.data?.wallet;
    if (!companyInvestmentWallet) {
      throw new Error('Company investment wallet not found');
    }
    const userWallet = await this.walletService.getUserWalletEntity(user.id);

    // Transfer bonus from company investment wallet to user's personal wallet
    await this.walletService.transferBetweenWallets(companyInvestmentWallet, userWallet, totalBonus);

    // Create transaction record
    const levelNames = levelsToReward.map((l) => l.title).join(', ');
    await this.transactionService.createTransaction({
      fromWalletId: companyInvestmentWallet.id,
      toWalletId: userWallet.id,
      amount: totalBonus,
      description: `Appraisal bonus for level promotion: ${levelNames} (hierarchy ${currentHierarchy} → ${newHierarchy})`,
      type: TransactionType.INCOME_APPRAISAL,
      status: TransactionStatus.APPROVED,
      entityId: user.id,
      initiator: user,
      statusUpdatedAt: new Date(),
      statusUpdatedBy: user.id,
      statusUpdater: user,
    });
  }
}
