import { Injectable } from '@nestjs/common';
import { User } from 'src/modules/user/entities/user.entity';
import { Package } from 'src/modules/packages/entities/package.entity';
import { UserPackage } from 'src/modules/packages/entities/user-package.entity';
import { Wallet } from 'src/modules/wallets/entities/wallet.entity';
import { WalletService } from 'src/modules/wallets/wallet.service';
import { TransactionService } from 'src/modules/transactions/transaction.service';
import { TransactionStatus, TransactionType } from 'src/modules/transactions/enums';
import { INCOME_CONSTANTS } from '../constants/income.constants';
import { UserClosureService } from 'src/modules/user/closure/closure.service';
import { LevelsService } from 'src/modules/levels/levels.service';
import { Level } from 'src/modules/levels/entities/level.entity';
import { UserLevel } from 'src/modules/levels/entities/user-level.entity';
import { BotsService } from 'src/modules/bots/bots.service';

/**
 * Passive Income Service - Handles all passive income calculation logic and package purchase transactions
 * Follows Single Responsibility Principle - handles passive income calculations and purchase transaction distribution
 */
@Injectable()
export class PassiveIncomeService {
  constructor(
    private readonly walletService: WalletService,
    private readonly transactionService: TransactionService,
    private readonly userClosureService: UserClosureService,
    private readonly levelsService: LevelsService,
    private readonly botsService: BotsService,
  ) {}

  /**
   * Handles package purchase transaction with 93% to company and 7% to upline distribution
   * @param user - The user buying the package
   * @param pkg - The package being purchased
   * @param userPackage - The created user-package entity
   * @param userWallet - The user's wallet entity
   * @param companyIncomeWallet - The company's income wallet
   * @param investmentAmount - The amount being invested (i.e. package purchase amount)
   */
  async handlePackagePurchaseTransaction(
    user: User,
    pkg: Package,
    userPackage: UserPackage,
    userWallet: Wallet,
    companyIncomeWallet: Wallet,
    investmentAmount: number,
  ): Promise<void> {
    // The amount to the company is always 93% of the investment
    const baseCompanyAmount = investmentAmount * INCOME_CONSTANTS.COMPANY_ALLOCATION_PERCENTAGE;
    // The total amount to be distributed as passive income is always 7%
    const uplineAmount = investmentAmount * INCOME_CONSTANTS.UPLINE_ALLOCATION_PERCENTAGE;

    // Try to distribute 7% up the upline, but it's not always possible
    // If any isn't distributed due to missing/invalid uplines, the undistributed portion will be returned
    const undistributedUplineAmount = await this.distributeUplineAllocation(
      user,
      pkg,
      userPackage,
      userWallet,
      uplineAmount,
    );

    // All money is debited from userWallet and credited to other parties
    // Company receives 93% + any undistributed portion of the remaining 7%
    const totalCompanyAmount = baseCompanyAmount + undistributedUplineAmount;
    await this.transferCompanyAllocation({
      user,
      pkg,
      userPackage,
      userWallet,
      companyIncomeWallet,
      amount: totalCompanyAmount,
      undistributedUplineAmount,
    });
  }

  /**
   * Tries to distribute the "upline" allocation (always 7%) as passive income
   * The company will keep all undistributed portion (e.g. no upline, levels missing, percentages zero, etc)
   *
   * @returns The undistributed remainder (to be given to company)
   */
  private async distributeUplineAllocation(
    user: User,
    pkg: Package,
    userPackage: UserPackage,
    userWallet: Wallet,
    uplineAmount: number,
  ): Promise<number> {
    if (uplineAmount <= 0) {
      return 0; // nothing to distribute
    }

    // All available levels, lowest hierarchy to highest
    const levels = await this.levelsService.getAllLevelsOrdered();
    if (!levels.length) {
      // If no levels are configured in the system, nothing can be distributed
      return uplineAmount;
    }

    // Prepare lookup tables for "what percentage goes to what hierarchy", etc
    const { hierarchyPercentages, levelIdToHierarchy, maxHierarchy } = this.buildLevelLookups(levels);
    if (maxHierarchy <= 0) {
      // Defensive: somehow all levels have zero hierarchy (should not occur!)
      return uplineAmount;
    }

    // What is the purchasing user's level? (e.g. at what hierarchy do we start distributing above)
    const purchaserLevel = await this.levelsService.getUserCurrentLevel(user.id);

    // Start distributing from just above the purchaser's own hierarchy (if no level, acts as if zero)
    let lastCoveredHierarchy = Math.min(this.resolveHierarchy(purchaserLevel, levelIdToHierarchy), maxHierarchy);

    let remainingAmount = uplineAmount;

    // Find all ancestors/referrers above the purchaser (direct/indirect) using closure (hierarchical tree)
    // Only ancestors with depth > 0 (skip self)
    const ancestorEntries = await this.userClosureService.getAllAscendentsOfUser(user.id, true, { ancestorId: true });
    const ancestorIds = ancestorEntries.map((entry) => entry.ancestorId);

    // For all ancestors, get their currently active levels
    const ancestorLevels = await this.levelsService.getActiveLevelsForUsers(ancestorIds);

    const ancestorLevelMap = new Map<number, UserLevel>();
    ancestorLevels.forEach((userLevel) => {
      ancestorLevelMap.set(userLevel.userId, userLevel);
    });

    // This loop walks up the upline ancestry chain from closest → furthest (or as closure data orders them)
    // Pay out as long as there is anything to pay and we haven't paid all possible hierarchies
    for (const ancestor of ancestorEntries) {
      if (remainingAmount <= 0 || lastCoveredHierarchy >= maxHierarchy) {
        break; // Nothing left to allocate, or we've distributed all configured levels
      }

      // What level does this ancestor have? (What hierarchy are they at)
      const ancestorLevel = ancestorLevelMap.get(ancestor.ancestorId);
      const ancestorHierarchy = this.resolveHierarchy(ancestorLevel, levelIdToHierarchy);

      // If ancestor's hierarchy is blank or is not higher than our "last covered", ignore them
      if (!ancestorHierarchy || ancestorHierarchy <= lastCoveredHierarchy) {
        continue;
      }

      // We are only considering the gap between lastCoveredHierarchy and the current ancestor
      // e.g. if we already "passed" levels 1-3 and ancestor is at level 5, they are eligible for levels 4..5
      const startLevel = lastCoveredHierarchy + 1;
      const endLevel = Math.min(ancestorHierarchy, maxHierarchy);

      // How much (in percentage) should be rewarded for this range of levels (4 and 5 in our example)
      const percentageForRange = this.calculatePercentageForRange(hierarchyPercentages, startLevel, endLevel);

      if (percentageForRange <= 0) {
        // This ancestor gets nothing; move up to their range
        lastCoveredHierarchy = endLevel;
        continue;
      }

      // How much money does this ancestor get?
      // If this is the last possible ancestor, may not use up all remainingAmount.
      const shareAmount = this.calculateShareAmount(uplineAmount, percentageForRange, remainingAmount);
      if (shareAmount <= 0) {
        lastCoveredHierarchy = endLevel;
        continue;
      }

      // Find this ancestor's wallet. (If missing, method will throw/not payout.)
      const ancestorWallet = await this.walletService.getUserWalletEntity(ancestor.ancestorId);

      await this.transferPassiveShare({
        fromWallet: userWallet,
        toWallet: ancestorWallet,
        amount: shareAmount,
        description: `Passive income (${pkg.title}) levels ${startLevel}-${endLevel} for user #${ancestor.ancestorId}`,
        initiator: user,
        entityId: userPackage.id,
        recipientUserId: ancestor.ancestorId,
      });

      remainingAmount -= shareAmount;
      lastCoveredHierarchy = endLevel;
    }

    // Anything not distributed (e.g. not enough ancestors, gaps in hierarchy, etc)
    // must be given to the company
    return remainingAmount;
  }

  /**
   * Build maps for level hierarchy → % and level id → hierarchy
   */
  private buildLevelLookups(levels: Level[]): {
    hierarchyPercentages: Map<number, number>;
    levelIdToHierarchy: Map<number, number>;
    maxHierarchy: number;
  } {
    const hierarchyPercentages = new Map<number, number>();
    const levelIdToHierarchy = new Map<number, number>();
    let maxHierarchy = 0;

    for (const level of levels) {
      const hierarchy = level.hierarchy;
      const percentage = Number(level.passiveIncomePercentage ?? 0);
      hierarchyPercentages.set(hierarchy, percentage);
      levelIdToHierarchy.set(level.id, hierarchy);

      if (hierarchy > maxHierarchy) {
        maxHierarchy = hierarchy;
      }
    }

    return { hierarchyPercentages, levelIdToHierarchy, maxHierarchy };
  }

  /**
   * Gets the "hierarchy" number for a user's active level, using lookups.
   * Returns 0 if no level is found.
   */
  private resolveHierarchy(userLevel: UserLevel | null | undefined, levelIdLookup: Map<number, number>): number {
    if (!userLevel) {
      return 0;
    }

    if (userLevel.level?.hierarchy) {
      return userLevel.level.hierarchy;
    }

    if (userLevel.levelId) {
      return levelIdLookup.get(userLevel.levelId) ?? 0;
    }

    return 0; // No hierarchy found
  }

  /**
   * For a range of hierarchies (startLevel..endLevel), sums up their passive income percentages.
   */
  private calculatePercentageForRange(
    hierarchyPercentages: Map<number, number>,
    startLevel: number,
    endLevel: number,
  ): number {
    if (startLevel > endLevel) {
      return 0;
    }

    let total = 0;
    for (let hierarchy = startLevel; hierarchy <= endLevel; hierarchy += 1) {
      total += hierarchyPercentages.get(hierarchy) ?? 0;
    }
    return total;
  }

  /**
   * Calculates share amount in currency, never exceeding the remaining amount.
   *
   * @param totalAmount - The 7% pool we are distributing from
   * @param percentage - The piece a given recipient should receive (e.g. for levels 4..5)
   * @param remainingAmount - Funds left to distribute (cannot distribute more than this)
   */
  private calculateShareAmount(totalAmount: number, percentage: number, remainingAmount: number): number {
    if (percentage <= 0 || totalAmount <= 0 || remainingAmount <= 0) {
      return 0;
    }

    const calculated = totalAmount * (percentage / 100);
    return Math.min(calculated, remainingAmount);
  }

  /**
   * Transfers a passive income share from one wallet to another, and creates the corresponding transaction record.
   * Will also update recipient's "active bot income received", if recipientUserId is included.
   */
  private async transferPassiveShare(params: {
    fromWallet: Wallet;
    toWallet: Wallet;
    amount: number;
    description: string;
    initiator: User;
    entityId: number;
    recipientUserId?: number;
  }): Promise<void> {
    const { fromWallet, toWallet, amount, description, initiator, entityId, recipientUserId } = params;

    if (amount <= 0) {
      return;
    }

    // Money transfer (userWallet → ancestor's wallet)
    await this.walletService.transferBetweenWallets(fromWallet, toWallet, amount);
    // Transaction record
    await this.transactionService.createTransaction({
      fromWalletId: fromWallet.id,
      toWalletId: toWallet.id,
      amount,
      description,
      type: TransactionType.INCOME_PASSIVE,
      status: TransactionStatus.APPROVED,
      entityId,
      initiator,
      statusUpdatedAt: new Date(),
      statusUpdatedBy: initiator.id,
      statusUpdater: initiator,
    });

    // Increase passive income counter for receiving user's active bot
    if (recipientUserId) {
      await this.botsService.increaseActiveBotIncomeReceived(recipientUserId, amount);
    }
  }

  /**
   * Transfers the company allocation from the user's wallet to the company wallet,
   * and creates the appropriate transaction record.
   */
  private async transferCompanyAllocation(params: {
    user: User;
    pkg: Package;
    userPackage: UserPackage;
    userWallet: Wallet;
    companyIncomeWallet: Wallet;
    amount: number;
    undistributedUplineAmount: number;
  }): Promise<void> {
    const { user, pkg, userPackage, userWallet, companyIncomeWallet, amount, undistributedUplineAmount } = params;

    if (amount <= 0) {
      return;
    }

    // Transfer company allocation (userWallet → companyIncomeWallet)
    await this.walletService.transferBetweenWallets(userWallet, companyIncomeWallet, amount);

    const descriptionParts = [`Purchase of package ${pkg.title} by ${user.fullName} - Company allocation (93%)`];
    if (undistributedUplineAmount > 0) {
      descriptionParts.push('+ undistributed passive share');
    }

    // Record company allocation transaction for purchase
    await this.transactionService.createTransaction({
      fromWalletId: userWallet.id,
      toWalletId: companyIncomeWallet.id,
      amount,
      description: descriptionParts.join(' '),
      type: TransactionType.PURCHASE_PACKAGE,
      status: TransactionStatus.APPROVED,
      entityId: userPackage.id,
      initiator: user,
      statusUpdatedAt: new Date(),
      statusUpdatedBy: user.id,
      statusUpdater: user,
    });
  }
}
