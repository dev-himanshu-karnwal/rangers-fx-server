import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { BotActivation } from './entities';
import { BotActivationResponseDto, ActivateBotDto } from './dto';
import { ApiResponse } from 'src/common/response/api.response';
import { BOT_CONSTANTS } from './constants';
import { BotActivationStatus } from './enums';
import { User } from '../user/entities';
import { WalletService } from '../wallets/wallet.service';
import { Transaction } from '../transactions/entities';
import { TransactionStatus, TransactionType } from '../transactions/enums/transaction.enum';
import { TransactionResponseDto } from '../transactions/dto';
import { TransactionService } from '../transactions/transaction.service';
import { UserService } from '../user/user.service';
import { WalletResponseDto } from '../wallets/dto';
import { QueryParamsDto, QueryParamsHelper } from 'src/common/query';
import { PaginatedResult } from 'src/common/pagination/pagination-query.dto';

@Injectable()
export class BotsService {
  constructor(
    @InjectRepository(BotActivation)
    private readonly botActivationRepository: Repository<BotActivation>,
    private readonly walletService: WalletService,
    private readonly transactionService: TransactionService,
    private readonly userService: UserService,
  ) {}

  /**
   * Activates the bot for a user by validating wallets, allocating funds, and
   * persisting the activation alongside the related transactions.
   */
  async activateBot(
    user: User,
    activateBotDto: ActivateBotDto,
  ): Promise<
    ApiResponse<{
      botActivation: BotActivationResponseDto;
      transactions: TransactionResponseDto[];
    }>
  > {
    // Make sure the user does not have another active bot
    await this.ensureUserHasNoActiveBot(user.id);

    // Get the user's wallet
    const userWallet = await this.getUserWalletOrThrow(user.id);

    // Get the referrer and their wallet, if any
    const { referrer, referrerWallet } = await this.getReferrerContext(user);

    // Check that the user has enough balance considering pending transactions
    await this.transactionService.ensureSufficientBalanceWithPendingTransactions(
      userWallet,
      BOT_CONSTANTS.ACTIVATION_AMOUNT,
    );

    // Get the company's income wallet
    const companyIncomeWallet = await this.getCompanyIncomeWallet();

    // Calculate the allocation amounts (company/referrer)
    const allocations = this.calculateAllocationAmounts(Boolean(referrer));

    // Perform wallet balance transfers based on allocation
    await this.applyWalletTransfers({
      userWallet,
      companyIncomeWallet,
      referrerWallet,
      ...allocations,
    });

    // Create the bot activation record in the database
    const botActivation = await this.createBotActivationRecord(user, userWallet, activateBotDto);

    // Create all the relevant transaction records for activation
    const transactions = await this.createActivationTransactions({
      user,
      userWallet,
      companyIncomeWallet,
      referrerWallet,
      botActivationId: botActivation.id,
      ...allocations,
    });

    // Return success response with activation and transaction details
    return ApiResponse.success('Bot activated successfully', {
      botActivation: BotActivationResponseDto.fromEntity(botActivation),
      transactions: transactions.map((transaction) => TransactionResponseDto.fromEntity(transaction as Transaction)),
    });
  }

  /**
   * Gets the active bot activation for a user and returns it as a DTO.
   * @param user - User to get the active bot for
   * @returns BotActivation entity if found, null otherwise
   */
  async getActiveBot(user: User): Promise<ApiResponse<{ botActivation: BotActivationResponseDto }>> {
    const botActivation = await this.getActiveBotActivation(user.id);
    if (!botActivation) {
      throw new NotFoundException('No active bot activation found for the user');
    }
    return ApiResponse.success('Active bot activation found', {
      botActivation: BotActivationResponseDto.fromEntity(botActivation),
    });
  }

  /**
   * Gets the user's bots with pagination, sorting, and filtering.
   * @param user - User to get the bots for
   * @param query - Query parameters (pagination, sorting, filters)
   * @returns Paginated bots response
   */
  async getUserBots(
    user: User,
    query: QueryParamsDto,
  ): Promise<
    ApiResponse<{
      meta: {
        total: number;
        page: number;
        limit: number;
      };
      bots: BotActivationResponseDto[];
    }>
  > {
    // Parse query parameters
    const parsed = QueryParamsHelper.parse(query);

    // Build query builder for complex filtering (date ranges, search)
    const queryBuilder = this.botActivationRepository.createQueryBuilder('bot');
    const metadata = this.botActivationRepository.metadata;

    // Base filter: always filter by user ID
    const userIdColumn = metadata.findColumnWithPropertyName('userId');
    queryBuilder.where(`bot.${userIdColumn?.databaseName || 'user_id'} = :userId`, { userId: user.id });

    // Apply filters
    const { filters } = parsed;

    // Status filter
    if (filters.status) {
      const statusColumn = metadata.findColumnWithPropertyName('status');
      queryBuilder.andWhere(`bot.${statusColumn?.databaseName || 'status'} = :status`, { status: filters.status });
    }

    // Search filter (searches in notes field)
    if (filters.search) {
      const notesColumn = metadata.findColumnWithPropertyName('notes');
      queryBuilder.andWhere(`bot.${notesColumn?.databaseName || 'notes'} ILIKE :search`, {
        search: `%${filters.search}%`,
      });
    }

    // Date range filters
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      const createdAtColumn = metadata.findColumnWithPropertyName('createdAt');
      queryBuilder.andWhere(`bot.${createdAtColumn?.databaseName || 'created_at'} >= :startDate`, { startDate });
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      const createdAtColumn = metadata.findColumnWithPropertyName('createdAt');
      queryBuilder.andWhere(`bot.${createdAtColumn?.databaseName || 'created_at'} <= :endDate`, { endDate });
    }

    // Apply sorting
    // Use entity metadata to get column names for proper mapping
    const orderEntries = Object.entries(parsed.order);

    if (orderEntries.length > 0) {
      const [firstField, firstDirection] = orderEntries[0];
      const firstColumn = metadata.findColumnWithPropertyName(firstField);
      if (firstColumn) {
        queryBuilder.orderBy(`bot.${firstColumn.databaseName}`, firstDirection);
      } else {
        // Fallback to property name if column not found
        queryBuilder.orderBy(`bot.${firstField}`, firstDirection);
      }

      // Add additional sort fields
      for (let i = 1; i < orderEntries.length; i++) {
        const [field, direction] = orderEntries[i];
        const column = metadata.findColumnWithPropertyName(field);
        if (column) {
          queryBuilder.addOrderBy(`bot.${column.databaseName}`, direction);
        } else {
          // Fallback to property name if column not found
          queryBuilder.addOrderBy(`bot.${field}`, direction);
        }
      }
    } else {
      // Default sorting if none provided
      queryBuilder.orderBy('bot.created_at', 'DESC');
    }

    // Apply pagination
    queryBuilder.skip(parsed.skip).take(parsed.take);

    // Execute query
    const [bots, total] = await queryBuilder.getManyAndCount();

    const result = QueryParamsHelper.toPaginatedResultWithEntityKey(
      bots.map((bot) => BotActivationResponseDto.fromEntity(bot)),
      total,
      parsed,
      'bots',
    );

    return ApiResponse.success('User bots found', result);
  }

  /**
   * Gets the active bot activation for a user.
   * @param userId - User ID to get the active bot for
   * @returns BotActivation entity if found, null otherwise
   */
  async getActiveBotActivation(userId: number): Promise<BotActivation | null> {
    return await this.botActivationRepository.findOne({
      where: {
        userId,
        status: BotActivationStatus.ACTIVE,
      },
    });
  }

  /**
   * Saves a bot activation by updating its entity.
   * @param botActivation - Bot activation to save
   * @returns Updated bot activation
   */
  async saveBot(botActivation: BotActivation): Promise<BotActivation> {
    return await this.botActivationRepository.save(botActivation);
  }

  /**
   * Expires a bot activation by setting its status to EXPIRED.
   * @param botActivation - Bot activation to expire
   * @returns Updated bot activation
   */
  async expireBot(botActivation: BotActivation): Promise<BotActivation> {
    botActivation.status = BotActivationStatus.EXPIRED;
    return await this.botActivationRepository.save(botActivation);
  }

  /**
   * Updates bot max income by adding the increase in max income
   * @param botActivation - Bot activation to update
   * @param increaseInMaxIncome - Increase in max income
   * @returns Updated bot activation
   */
  async updateBotMaxIncome(botActivation: BotActivation, increaseInMaxIncome: number): Promise<BotActivation> {
    botActivation.maxIncome = (botActivation.maxIncome || 0) + increaseInMaxIncome;
    return await this.saveBot(botActivation);
  }

  /**
   * Checks if bot is expired based on reference date and expiration period
   * @param referenceDate - Reference date (bot creation or last package purchase)
   * @param expirationMonths - Number of months until expiration
   * @param lastPackageDate - Last package purchase date (null if no packages)
   * @returns True if expired
   */
  isBotExpired(referenceDate: Date, expirationMonths: number, lastPackageDate: Date | null = null): boolean {
    const expirationDate = new Date(lastPackageDate || referenceDate);
    expirationDate.setMonth(expirationDate.getMonth() + expirationMonths);
    return new Date() > expirationDate;
  }

  /**
   * Checks if bot was purchased today (ignoring time)
   * @param botCreatedAt - Bot creation date
   * @returns True if bot was created today
   */
  isBotPurchasedToday(botCreatedAt: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const botDate = new Date(botCreatedAt);
    botDate.setHours(0, 0, 0, 0);

    return botDate.getTime() === today.getTime();
  }

  /**
   * Ensures the user does not already have an active bot.
   */
  private async ensureUserHasNoActiveBot(userId: number): Promise<void> {
    const existingActivation = await this.getActiveBotActivation(userId);

    if (existingActivation) {
      throw new BadRequestException('You already have an active bot');
    }
  }

  /**
   * Fetches a user's wallet or throws when it is missing.
   */
  private async getUserWalletOrThrow(userId: number) {
    const userWalletResponse = await this.walletService.getUserWallet(userId);
    const userWallet = userWalletResponse.data?.wallet;

    if (!userWallet) {
      throw new NotFoundException('User wallet not found');
    }

    return userWallet;
  }

  /**
   * Loads the referrer user and wallet when available, enforcing both exist.
   */
  private async getReferrerContext(user: User) {
    if (!user.referredByUserId) {
      return { referrer: null, referrerWallet: null };
    }

    const referrer = await this.userService.findByIdEntity(user.referredByUserId);

    if (!referrer) {
      throw new NotFoundException('Referrer user not found');
    }

    const referrerWalletResponse = await this.walletService.getUserWallet(referrer.id);
    const referrerWallet = referrerWalletResponse.data?.wallet;

    if (!referrerWallet) {
      throw new NotFoundException('Referrer wallet not found');
    }

    return { referrer, referrerWallet };
  }

  /**
   * Fetches the company income wallet or throws when missing.
   */
  private async getCompanyIncomeWallet() {
    const companyIncomeWalletResponse = await this.walletService.getCompanyIncomeWallet();
    const companyIncomeWallet = companyIncomeWalletResponse.data?.wallet;

    if (!companyIncomeWallet) {
      throw new NotFoundException('Company income wallet not found');
    }

    return companyIncomeWallet;
  }

  /**
   * Calculates how the activation amount should be split between company and referral.
   */
  private calculateAllocationAmounts(hasReferrer: boolean) {
    return {
      companyAllocationAmount: hasReferrer ? BOT_CONSTANTS.COMPANY_ALLOCATION_AMOUNT : BOT_CONSTANTS.ACTIVATION_AMOUNT,
      referralAllocationAmount: hasReferrer ? BOT_CONSTANTS.REFERRAL_ALLOCATION_AMOUNT : 0,
    };
  }

  /**
   * Applies the wallet balance transfers and persists the wallets.
   */
  private async applyWalletTransfers({
    userWallet,
    companyIncomeWallet,
    referrerWallet,
    companyAllocationAmount,
    referralAllocationAmount,
  }: {
    userWallet: WalletResponseDto;
    companyIncomeWallet: WalletResponseDto;
    referrerWallet: WalletResponseDto | null;
    companyAllocationAmount: number;
    referralAllocationAmount: number;
  }) {
    userWallet.balance -= BOT_CONSTANTS.ACTIVATION_AMOUNT;
    companyIncomeWallet.balance += companyAllocationAmount;

    if (referralAllocationAmount > 0 && referrerWallet) {
      referrerWallet.balance += referralAllocationAmount;
      await this.walletService.saveWallet(referrerWallet);
    }

    await this.walletService.saveWallet(userWallet);
    await this.walletService.saveWallet(companyIncomeWallet);
  }

  /**
   * Creates and reloads the bot activation record to obtain full relations.
   */
  private async createBotActivationRecord(
    user: User,
    userWallet: WalletResponseDto,
    activateBotDto: ActivateBotDto,
  ): Promise<BotActivation> {
    const botActivation = this.botActivationRepository.create({
      user,
      wallet: userWallet,
      notes: activateBotDto.notes ?? null,
    });

    const savedBotActivation = await this.botActivationRepository.save(botActivation);
    const reloadedBotActivation = await this.botActivationRepository.findOne({
      where: { id: savedBotActivation.id },
      relations: ['user', 'wallet'],
    });

    if (!reloadedBotActivation) {
      throw new NotFoundException('Bot activation not found after creation');
    }

    return reloadedBotActivation;
  }

  /**
   * Persists activation transactions and returns the created entities.
   */
  private async createActivationTransactions({
    user,
    userWallet,
    companyIncomeWallet,
    referrerWallet,
    botActivationId,
    companyAllocationAmount,
    referralAllocationAmount,
  }: {
    user: User;
    userWallet: WalletResponseDto;
    companyIncomeWallet: WalletResponseDto;
    referrerWallet: WalletResponseDto | null;
    botActivationId: number;
    companyAllocationAmount: number;
    referralAllocationAmount: number;
  }) {
    const transactionPayloads = this.buildTransactionPayloads({
      user,
      userWallet,
      companyIncomeWallet,
      referrerWallet,
      botActivationId,
      companyAllocationAmount,
      referralAllocationAmount,
    });

    return Promise.all(
      transactionPayloads.map((transaction) => this.transactionService.createTransaction(transaction)),
    );
  }

  /**
   * Builds transaction payloads for the company allocation and optional referral allocation.
   */
  private buildTransactionPayloads({
    user,
    userWallet,
    companyIncomeWallet,
    referrerWallet,
    botActivationId,
    companyAllocationAmount,
    referralAllocationAmount,
  }: {
    user: User;
    userWallet: WalletResponseDto;
    companyIncomeWallet: WalletResponseDto;
    referrerWallet: WalletResponseDto | null;
    botActivationId: number;
    companyAllocationAmount: number;
    referralAllocationAmount: number;
  }) {
    const transactionTemplates = [
      {
        amount: companyAllocationAmount,
        toWallet: companyIncomeWallet,
      },
      ...(referralAllocationAmount > 0 && referrerWallet
        ? [
            {
              amount: referralAllocationAmount,
              toWallet: referrerWallet,
            },
          ]
        : []),
    ];

    return transactionTemplates.map(
      (template) =>
        ({
          amount: template.amount,
          description: BOT_CONSTANTS.ACTIVATION_TRANSACTION_DESCRIPTION,
          type: TransactionType.INCOME_BOT,
          fromWallet: userWallet,
          toWallet: template.toWallet,
          initiator: user,
          entityId: botActivationId,
          status: TransactionStatus.APPROVED,
          statusUpdatedAt: new Date(),
          statusUpdatedBy: user.id,
          statusUpdater: user,
        }) as DeepPartial<Transaction>,
    );
  }
}
