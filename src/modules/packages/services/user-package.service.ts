import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPackage } from '../entities/user-package.entity';
import { Package } from '../entities/package.entity';
import { PurchasePackageDto } from '../dto/purchase-package.dto';
import { UserPackageResponseDto } from '../dto/user-package-response.dto';
import { ApiResponse } from '../../../common/response/api.response';
import { User } from '../../user/entities/user.entity';
import { WalletService } from '../../wallets/wallet.service';
import { TransactionService } from '../../transactions/transaction.service';
import { BotsService } from '../../bots/bots.service';
import { PACKAGES_CONSTANTS } from '../constants';
import { BotActivation } from '../../bots/entities/bot-activation.entity';
import { UserService } from '../../user/user.service';
import { PackagesService } from '../packages.service';
import { Wallet } from '../../wallets/entities/wallet.entity';
import { UserPackagePostPurchaseService } from './user-package-post-purchase.service';
import { QueryParamsDto, QueryParamsHelper } from '../../../common/query';
import { UserPackageStatus } from '../enums/user-package-status.enum';
import { PassiveIncomeService } from '../../income/services/passive-income.service';

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
    private readonly passiveIncomeService: PassiveIncomeService,
  ) {}

  /**
   * Gets user packages with pagination, sorting, and filtering.
   * @param user - User entity
   * @param query - Query parameters (pagination, sorting, filters)
   * @returns ApiResponse containing paginated user packages
   */
  async getUserPackages(
    user: User,
    query: QueryParamsDto,
  ): Promise<
    ApiResponse<{
      meta: {
        total: number;
        page: number;
        limit: number;
      };
      userPackages: UserPackageResponseDto[];
    }>
  > {
    // Parse query parameters
    const parsed = QueryParamsHelper.parse(query);

    // Build query builder for complex filtering (date ranges, search)
    const queryBuilder = this.userPackageRepository.createQueryBuilder('userPackage');
    const metadata = this.userPackageRepository.metadata;

    // Base filter: always filter by user ID
    const userIdColumn = metadata.findColumnWithPropertyName('userId');
    queryBuilder.where(`userPackage.${userIdColumn?.databaseName || 'user_id'} = :userId`, { userId: user.id });

    // Apply filters
    const { filters } = parsed;

    // Status filter
    if (filters.status) {
      const statusColumn = metadata.findColumnWithPropertyName('status');
      queryBuilder.andWhere(`userPackage.${statusColumn?.databaseName || 'status'} = :status`, {
        status: filters.status,
      });
    }

    // Date range filters
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      const createdAtColumn = metadata.findColumnWithPropertyName('createdAt');
      queryBuilder.andWhere(`userPackage.${createdAtColumn?.databaseName || 'created_at'} >= :startDate`, {
        startDate,
      });
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      const createdAtColumn = metadata.findColumnWithPropertyName('createdAt');
      queryBuilder.andWhere(`userPackage.${createdAtColumn?.databaseName || 'created_at'} <= :endDate`, {
        endDate,
      });
    }

    // Apply sorting
    const orderEntries = Object.entries(parsed.order);

    if (orderEntries.length > 0) {
      const [firstField, firstDirection] = orderEntries[0];
      const firstColumn = metadata.findColumnWithPropertyName(firstField);
      if (firstColumn) {
        queryBuilder.orderBy(`userPackage.${firstColumn.databaseName}`, firstDirection);
      } else {
        queryBuilder.orderBy(`userPackage.${firstField}`, firstDirection);
      }

      // Add additional sort fields
      for (let i = 1; i < orderEntries.length; i++) {
        const [field, direction] = orderEntries[i];
        const column = metadata.findColumnWithPropertyName(field);
        if (column) {
          queryBuilder.addOrderBy(`userPackage.${column.databaseName}`, direction);
        } else {
          queryBuilder.addOrderBy(`userPackage.${field}`, direction);
        }
      }
    } else {
      // Default sorting by createdAt DESC
      queryBuilder.orderBy('userPackage.created_at', 'DESC');
    }

    // Apply pagination
    queryBuilder.skip(parsed.skip).take(parsed.take);

    // Execute query
    const [userPackages, total] = await queryBuilder.getManyAndCount();

    const result = QueryParamsHelper.toPaginatedResultWithEntityKey(
      userPackages.map((userPackage) => UserPackageResponseDto.fromEntity(userPackage)),
      total,
      parsed,
      'userPackages',
    );

    return ApiResponse.success('Packages retrieved successfully', result);
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

    // Validate wallet balance
    await this.transactionService.ensureSufficientBalanceWithPendingTransactions(
      userWallet,
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

    // Update domain entities that depend on the purchase success
    await this.userPackagePostPurchaseService.handlePostPurchaseSuccess(user, bot);

    // Increment business done amount
    await this.userService.incrementBusinessDone(user, purchasePackageDto.investmentAmount);

    // Handle package purchase transaction (93% to company, 7% to upline)
    await this.passiveIncomeService.handlePackagePurchaseTransaction(
      user,
      pkg,
      userPackage,
      userWallet,
      companyIncomeWallet,
      purchasePackageDto.investmentAmount,
    );

    await this.userPackagePostPurchaseService.ensureInvestorRoleAndLevel(user);

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

  /**
   * Gets all in-progress user packages for a user
   * @param userId - User ID
   * @returns Array of user packages with package relation
   */
  async getUserInProgressPackages(userId: number): Promise<UserPackage[]> {
    return await this.userPackageRepository.find({
      where: { userId, status: UserPackageStatus.INPROGRESS },
      relations: ['package'],
    });
  }
}
