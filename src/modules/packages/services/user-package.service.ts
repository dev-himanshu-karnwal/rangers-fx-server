import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPackage } from '../entities/user-package.entity';
import { Package } from '../entities/package.entity';
import { PurchasePackageDto } from '../dto/purchase-package.dto';
import { UserPackageResponseDto } from '../dto/user-package-response.dto';
import { ApiResponse } from 'src/common/response/api.response';
import { User } from '../../user/entities/user.entity';
import { WalletService } from '../../wallets/wallet.service';
import { TransactionService } from '../../transactions/transaction.service';
import { BotsService } from '../../bots/bots.service';
import { TransactionStatus, TransactionType } from 'src/modules/transactions/enums';
import { PACKAGES_CONSTANTS } from '../constants';
import { BotActivation } from '../../bots/entities/bot-activation.entity';
import { UserService } from 'src/modules/user/user.service';
import { PackagesService } from '../packages.service';
import { WalletResponseDto } from '../../wallets/dto';
import { Wallet } from 'src/modules/wallets/entities';

/**
 * User Package Service - handles user package purchase operations
 * Follows Single Responsibility Principle - handles package purchase operations only
 */
@Injectable()
export class UserPackageService {
  constructor(
    @InjectRepository(UserPackage)
    private readonly userPackageRepository: Repository<UserPackage>,
    private readonly packagesService: PackagesService,
    private readonly walletService: WalletService,
    private readonly transactionService: TransactionService,
    private readonly botsService: BotsService,
    private readonly userService: UserService,
  ) {}

  /**
   * Purchases a package for a user
   * Orchestrates the entire purchase flow: validation, wallet operations, bot operations, and package creation
   * @param user - The user purchasing the package
   * @param purchasePackageDto - DTO containing packageId and investmentAmount
   * @returns ApiResponse containing the created user package
   */
  async purchasePackage(
    user: User,
    purchasePackageDto: PurchasePackageDto,
  ): Promise<ApiResponse<{ userPackage: UserPackageResponseDto }>> {
    // Validate package and investment amount
    const pkg = await this.validatePackageAndAmount(purchasePackageDto);

    // Get and validate wallets
    const { userWallet, companyIncomeWallet } = await this.getAndValidateWallets(user.id);

    // Validate wallet balance
    await this.validateWalletBalance(userWallet, purchasePackageDto.investmentAmount);

    // Get and validate bot
    const bot = await this.getAndValidateBot(user.id);

    // Check bot expiration and validate purchase conditions
    await this.validateBotForPurchase(bot, user);

    // Create user package
    const userPackage = await this.createUserPackage(user, pkg, bot, purchasePackageDto.investmentAmount);

    // Process financial transactions
    await this.processFinancialTransactions(
      user,
      userWallet,
      companyIncomeWallet,
      pkg,
      purchasePackageDto.investmentAmount,
      userPackage.id,
    );

    // Update bot max income
    await this.updateBotMaxIncome(bot, purchasePackageDto.investmentAmount);

    // Update user role if needed
    await this.updateUserRoleIfNeeded(user);

    // Return response with relations
    return this.buildSuccessResponse(userPackage.id);
  }

  // ==================== Validation Methods ====================

  /**
   * Validates package exists and investment amount is within valid range
   * @param purchasePackageDto - Purchase DTO containing packageId and investmentAmount
   * @returns Package entity
   * @throws NotFoundException if package not found
   * @throws BadRequestException if investment amount is out of range
   */
  private async validatePackageAndAmount(purchasePackageDto: PurchasePackageDto): Promise<Package> {
    const pkg = await this.packagesService.getPackageEntityOrThrow(purchasePackageDto.packageId);

    if (purchasePackageDto.investmentAmount < pkg.minPrice || purchasePackageDto.investmentAmount > pkg.maxPrice) {
      throw new BadRequestException(`Investment amount must be between ${pkg.minPrice} and ${pkg.maxPrice}`);
    }

    return pkg;
  }

  /**
   * Gets and validates user wallet and company income wallet
   * @param userId - User ID
   * @returns Object containing user wallet and company income wallet
   * @throws NotFoundException if wallets not found
   */
  private async getAndValidateWallets(userId: number): Promise<{
    userWallet: WalletResponseDto;
    companyIncomeWallet: WalletResponseDto;
  }> {
    const userWalletResponse = await this.walletService.getUserWallet(userId);
    const userWallet = userWalletResponse.data?.wallet;

    if (!userWallet) {
      throw new NotFoundException('User wallet not found');
    }

    const companyIncomeWalletResponse = await this.walletService.getCompanyIncomeWallet();
    const companyIncomeWallet = companyIncomeWalletResponse.data?.wallet;

    if (!companyIncomeWallet) {
      throw new NotFoundException('Company income wallet not found');
    }

    return { userWallet, companyIncomeWallet };
  }

  /**
   * Validates wallet has sufficient balance considering pending transactions
   * @param userWallet - User wallet
   * @param amount - Amount to validate
   * @throws BadRequestException if insufficient balance
   */
  private async validateWalletBalance(userWallet: WalletResponseDto, amount: number): Promise<void> {
    await this.transactionService.ensureSufficientBalanceWithPendingTransactions(userWallet, amount);
  }

  /**
   * Gets and validates active bot for user
   * @param userId - User ID
   * @returns Bot activation entity
   * @throws NotFoundException if no active bot found
   */
  private async getAndValidateBot(userId: number): Promise<BotActivation> {
    const bot = await this.botsService.getActiveBotActivation(userId);
    if (!bot) {
      throw new NotFoundException('No active bot activation found for the user');
    }
    return bot;
  }

  /**
   * Validates bot for purchase: checks expiration and purchase conditions
   * @param bot - Bot activation
   * @param user - User entity
   * @throws BadRequestException if bot expired or purchase conditions not met
   */
  private async validateBotForPurchase(bot: BotActivation, user: User): Promise<void> {
    await this.checkAndExpireBotIfNeeded(bot, user);
    await this.validatePurchaseConditions(bot);
  }

  /**
   * Checks if bot should be expired and expires it if needed
   * A bot expires if no package has been purchased with it within the expiration period (3 months)
   * @param bot - Bot activation to check
   * @param user - User entity
   * @throws BadRequestException if bot expired
   */
  private async checkAndExpireBotIfNeeded(bot: BotActivation, user: User): Promise<void> {
    const userPackageCount = await this.getUserPackagesCountByBotId(bot.id);

    if (userPackageCount === 0) {
      const isExpired = this.botsService.isBotExpired(bot.createdAt, PACKAGES_CONSTANTS.BOT_EXPIRATION_MONTHS, null);
      if (isExpired) {
        await this.expireBotAndDeactivateUser(bot, user);
        throw new BadRequestException('Bot has expired. No package was purchased within 3 months of bot activation.');
      }
      return;
    }
  }

  /**
   * Validates purchase conditions based on bot purchase date
   * 1. If bot is purchased today, user can buy any number of packages same day
   * 2. If bot is bought not today but is active, user can buy only 1 package with it
   * @param bot - Bot activation to validate
   * @throws BadRequestException if purchase conditions not met
   */
  private async validatePurchaseConditions(bot: BotActivation): Promise<void> {
    const isBotPurchasedToday = this.botsService.isBotPurchasedToday(bot.createdAt);

    if (isBotPurchasedToday) {
      return; // No restrictions for bots purchased today
    }

    // For bots not purchased today, only 1 package allowed
    const existingPackagesCount = await this.getUserPackagesCountByBotId(bot.id);
    if (existingPackagesCount > 0) {
      throw new BadRequestException(
        'You can only purchase 1 package with a bot that was not purchased today. This bot already has a package associated with it.',
      );
    }
  }

  // ==================== Package Creation Methods ====================

  /**
   * Creates a user package record
   * @param user - User entity
   * @param pkg - Package entity
   * @param bot - Bot activation entity
   * @param investmentAmount - Investment amount
   * @returns Created user package entity
   */
  private async createUserPackage(
    user: User,
    pkg: Package,
    bot: BotActivation,
    investmentAmount: number,
  ): Promise<UserPackage> {
    const userPackage = this.userPackageRepository.create({
      user,
      package: pkg,
      bot,
      investmentAmount,
      purchaseDate: new Date(),
    });

    return await this.userPackageRepository.save(userPackage);
  }

  // ==================== Financial Operations Methods ====================

  /**
   * Processes all financial transactions for package purchase
   * @param user - User entity
   * @param userWallet - User wallet
   * @param companyIncomeWallet - Company income wallet
   * @param pkg - Package entity
   * @param amount - Investment amount
   * @param userPackageId - User package ID for transaction reference
   */
  private async processFinancialTransactions(
    user: User,
    userWallet: Wallet,
    companyIncomeWallet: Wallet,
    pkg: Package,
    amount: number,
    userPackageId: number,
  ): Promise<void> {
    // Create transaction record
    await this.createPurchaseTransaction(user, userWallet, companyIncomeWallet, pkg, amount, userPackageId);

    // Update wallet balances
    await this.walletService.transferBetweenWallets(userWallet, companyIncomeWallet, amount);
  }

  /**
   * Creates a transaction record for package purchase
   * @param user - User entity
   * @param userWallet - User wallet
   * @param companyIncomeWallet - Company income wallet
   * @param pkg - Package entity
   * @param amount - Investment amount
   * @param userPackageId - User package ID
   */
  private async createPurchaseTransaction(
    user: User,
    userWallet: WalletResponseDto,
    companyIncomeWallet: WalletResponseDto,
    pkg: Package,
    amount: number,
    userPackageId: number,
  ): Promise<void> {
    await this.transactionService.createTransaction({
      fromWalletId: userWallet.id,
      toWalletId: companyIncomeWallet.id,
      amount,
      description: this.buildTransactionDescription(pkg.title, user.fullName, amount),
      type: TransactionType.PURCHASE_PACKAGE,
      status: TransactionStatus.APPROVED,
      entityId: userPackageId,
      initiator: user,
      statusUpdatedAt: new Date(),
      statusUpdatedBy: user.id,
      statusUpdater: user,
    });
  }

  // ==================== Bot Operations Methods ====================

  /**
   * Updates bot max income with the investment amount
   * @param bot - Bot activation entity
   * @param investmentAmount - Investment amount to add
   */
  private async updateBotMaxIncome(bot: BotActivation, investmentAmount: number): Promise<void> {
    await this.botsService.updateBotMaxIncome(bot, investmentAmount);
  }

  /**
   * Expires bot and deactivates user
   * @param bot - Bot activation to expire
   * @param user - User to deactivate
   */
  private async expireBotAndDeactivateUser(bot: BotActivation, user: User): Promise<void> {
    await this.botsService.expireBot(bot);
    await this.userService.deactivateUser(user);
  }

  // ==================== User Operations Methods ====================

  /**
   * Updates user role to investor if currently none
   * @param user - User entity
   */
  private async updateUserRoleIfNeeded(user: User): Promise<void> {
    await this.userService.updateUserRoleToInvestorIfNeeded(user);
  }

  // ==================== Query Methods ====================

  /**
   * Gets count of user packages by bot ID
   * @param botId - Bot ID
   * @returns Count of user packages
   */
  private async getUserPackagesCountByBotId(botId: number): Promise<number> {
    return await this.userPackageRepository.countBy({ botId });
  }

  /**
   * Gets user package with relations for response
   * @param userPackageId - User package ID
   * @returns User package entity with relations
   * @throws NotFoundException if not found
   */
  private async getUserPackageWithRelations(userPackageId: number): Promise<UserPackage> {
    const userPackage = await this.userPackageRepository.findOne({
      where: { id: userPackageId },
      relations: ['user', 'package', 'bot'],
    });

    if (!userPackage) {
      throw new NotFoundException('User package not found after creation');
    }

    return userPackage;
  }

  // ==================== Utility Methods ====================

  /**
   * Builds transaction description
   * @param packageTitle - Package title
   * @param userName - User full name
   * @param amount - Investment amount
   * @returns Transaction description string
   */
  private buildTransactionDescription(packageTitle: string, userName: string, amount: number): string {
    return `Purchase of package ${packageTitle} by ${userName} for ${amount}`;
  }

  /**
   * Builds success response with user package
   * @param userPackageId - User package ID
   * @returns Success API response
   */
  private async buildSuccessResponse(
    userPackageId: number,
  ): Promise<ApiResponse<{ userPackage: UserPackageResponseDto }>> {
    const userPackageWithRelations = await this.getUserPackageWithRelations(userPackageId);
    return ApiResponse.success('Package purchased successfully', {
      userPackage: UserPackageResponseDto.fromEntity(userPackageWithRelations),
    });
  }
}
