import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
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
import { UserPackageStatus } from '../enums';
import { UserPackagePostPurchaseService } from './user-package-post-purchase.service';

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
    private readonly userPackagePostPurchaseService: UserPackagePostPurchaseService,
  ) {}

  /**
   * Gets user packages
   * @param user - User entity
   * @param status - User package status
   * @returns ApiResponse containing the user packages
   * @throws NotFoundException if no packages found for the user
   */
  async getUserPackages(
    user: User,
    status: UserPackageStatus | undefined,
  ): Promise<ApiResponse<{ userPackages: UserPackageResponseDto[] }>> {
    const where: FindOptionsWhere<UserPackage> = { userId: user.id };
    if (status) where.status = status;

    const userPackages = await this.userPackageRepository.find({ where });
    if (userPackages.length === 0) {
      throw new NotFoundException(`No packages found for the user`);
    }
    return ApiResponse.success(`Packages retrieved successfully`, {
      userPackages: userPackages.map(UserPackageResponseDto.fromEntity),
    });
  }

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

    // Validate wallet balance (convert to DTO for transaction service)
    const userWalletDto = new WalletResponseDto(userWallet);
    await this.transactionService.ensureSufficientBalanceWithPendingTransactions(
      userWalletDto,
      purchasePackageDto.investmentAmount,
    );

    // Get and validate bot
    const bot = await this.botsService.getActiveBotActivation(user.id);
    if (!bot) {
      throw new NotFoundException('No active bot activation found for the user');
    }

    // Check bot expiration and validate purchase conditions
    await this.checkAndExpireBotIfNeeded(bot, user);
    await this.validatePurchaseConditions(bot);

    // Create user package
    const userPackage = await this.createUserPackage(user, pkg, bot, purchasePackageDto.investmentAmount);

    // Create transaction record
    await this.transactionService.createTransaction({
      fromWalletId: userWallet.id,
      toWalletId: companyIncomeWallet.id,
      amount: purchasePackageDto.investmentAmount,
      description: `Purchase of package ${pkg.title} by ${user.fullName} for ${purchasePackageDto.investmentAmount}`,
      type: TransactionType.PURCHASE_PACKAGE,
      status: TransactionStatus.APPROVED,
      entityId: userPackage.id,
      initiator: user,
      statusUpdatedAt: new Date(),
      statusUpdatedBy: user.id,
      statusUpdater: user,
    });

    // Update wallet balances
    await this.walletService.transferBetweenWallets(
      userWallet,
      companyIncomeWallet,
      purchasePackageDto.investmentAmount,
    );

    // Update domain entities that depend on the purchase success
    await this.userPackagePostPurchaseService.handlePostPurchaseSuccess(user, bot);

    // Return response with relations
    const userPackageWithRelations = await this.getUserPackageWithRelations(userPackage.id);
    return ApiResponse.success('Package purchased successfully', {
      userPackage: UserPackageResponseDto.fromEntity(userPackageWithRelations),
    });
  }

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
   * Gets and validates user wallet and company income wallet entities
   * @param userId - User ID
   * @returns Object containing user wallet and company income wallet entities
   * @throws NotFoundException if wallets not found
   */
  private async getAndValidateWallets(userId: number): Promise<{
    userWallet: Wallet;
    companyIncomeWallet: Wallet;
  }> {
    const userWallet = await this.walletService.getUserWalletEntity(userId);
    const companyIncomeWallet = await this.walletService.getCompanyIncomeWalletEntity();
    return { userWallet, companyIncomeWallet };
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
        await this.botsService.expireBot(bot);
        await this.userService.deactivateUser(user);
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
}
