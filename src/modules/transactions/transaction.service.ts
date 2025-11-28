import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import {
  AddCompanyTransactionDto,
  AddP2PTransactionDto,
  AddPersonalTransactionDto,
  TransactionResponseDto,
  WithdrawCompanyTransactionDto,
  WithdrawPersonalTransactionDto,
} from './dto';
import { TransactionStatus, TransactionType } from './enums/transaction.enum';
import { User } from '../user/entities';
import { WalletService } from '../wallets/wallet.service';
import { ApiResponse } from '../../common/response/api.response';
import { Wallet } from '../wallets/entities/wallet.entity';
import { QueryParamsDto, QueryParamsHelper } from '../../common/query';

/**
 * TransactionService provides business logic for handling transactions such as creation,
 * approval, rejection, and status updates for company transactions.
 */
@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly walletService: WalletService,
  ) {}

  /**
   * Creates and saves a Transaction entity to the database.
   * @param transactionData - Partial transaction payload used to create the entity
   * @returns The saved and reloaded Transaction entity
   */
  async createTransaction(transactionData: DeepPartial<Transaction>): Promise<Transaction> {
    const transaction = this.transactionRepository.create(transactionData);
    const saved = await this.transactionRepository.save(transaction);
    return this.reloadTransactionWithRelations(saved);
  }

  /**
   * Fetches all transactions from the repository with related entities.
   * - Includes relations: `toWallet`, `fromWallet`, `initiator`, and `statusUpdater`.
   * - Orders results by `createdAt` descending.
   * @returns ApiResponse containing an array of TransactionResponseDto
   */
  async getAllTransactions(
    user: User,
    query: QueryParamsDto,
  ): Promise<
    ApiResponse<{
      meta: { total: number; page: number; limit: number };
      transactions: TransactionResponseDto[];
    }>
  > {
    const parsed = QueryParamsHelper.parse(query);
    const userWallet = await this.walletService.getUserWalletEntity(user.id);
    const walletId = userWallet.id;

    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .where('(transaction.fromWalletId = :walletId OR transaction.toWalletId = :walletId)', { walletId })
      .leftJoin('transaction.fromWallet', 'fromWallet')
      .leftJoin('transaction.toWallet', 'toWallet')
      .leftJoin('fromWallet.user', 'fromWalletUser')
      .leftJoin('toWallet.user', 'toWalletUser');

    const metadata = this.transactionRepository.metadata;
    const { filters } = parsed;

    queryBuilder.select([
      'transaction.id',
      'transaction.fromWalletId',
      'transaction.toWalletId',
      'transaction.type',
      'transaction.status',
      'transaction.createdAt',
      'transaction.description',
    ]);
    queryBuilder.addSelect([
      'fromWallet.id',
      'fromWallet.userId',
      'toWallet.id',
      'toWallet.userId',
      'fromWalletUser.id',
      'fromWalletUser.fullName',
      'toWalletUser.id',
      'toWalletUser.fullName',
    ]);

    if (filters.status) {
      queryBuilder.andWhere('transaction.status = :status', { status: filters.status });
    }

    if (filters.type) {
      queryBuilder.andWhere('transaction.type = :type', { type: filters.type });
    }

    if (filters.direction) {
      const direction = String(filters.direction).toLowerCase();
      if (direction === 'incoming') {
        queryBuilder.andWhere('transaction.toWalletId = :walletId', { walletId });
      } else if (direction === 'outgoing') {
        queryBuilder.andWhere('transaction.fromWalletId = :walletId', { walletId });
      }
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      queryBuilder.andWhere('transaction.createdAt >= :startDate', { startDate });
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('transaction.createdAt <= :endDate', { endDate });
    }

    const orderEntries = Object.entries(parsed.order);
    if (orderEntries.length === 0) {
      queryBuilder.addOrderBy('transaction.createdAt', 'DESC');
    } else {
      for (const [field, direction] of orderEntries) {
        const column = metadata.findColumnWithPropertyName(field);
        if (!column) {
          continue;
        }
        queryBuilder.addOrderBy(`transaction.${column.propertyName}`, direction);
      }
    }

    queryBuilder.skip(parsed.skip).take(parsed.take);
    const [transactions, total] = await queryBuilder.getManyAndCount();

    const result = QueryParamsHelper.toPaginatedResultWithEntityKey(
      transactions.map((transaction) => TransactionResponseDto.fromEntity(transaction)),
      total,
      parsed,
      'transactions',
    );

    return ApiResponse.success('Transactions retrieved successfully', result);
  }

  /**
   * Creates and adds a company transaction to the company investment wallet.
   * @param addCompanyTransactionDto - Payload for the new company transaction
   * @param user - Authenticated user initiating the transaction
   * @returns Success ApiResponse containing the created transaction
   */
  async addCompanyTransaction(
    addCompanyTransactionDto: AddCompanyTransactionDto,
    user: User,
  ): Promise<ApiResponse<{ transaction: TransactionResponseDto }>> {
    const companyWalletResponse = await this.walletService.getCompanyInvestmentWallet();
    const companyWallet = companyWalletResponse.data!.wallet;

    const newTransaction = await this.createTransaction({
      amount: addCompanyTransactionDto.amount,
      description:
        addCompanyTransactionDto.description ?? `Add ${addCompanyTransactionDto.amount} to company investment wallet`,
      type: TransactionType.ADD_COMPANY,
      toWallet: companyWallet,
      initiator: user,
      entityId: companyWallet.id,
    });

    const reloaded = await this.reloadTransactionWithRelations(newTransaction);

    return ApiResponse.success<{ transaction: TransactionResponseDto }>('Company transaction added successfully', {
      transaction: TransactionResponseDto.fromEntity(reloaded),
    });
  }

  /**
   * Creates a withdrawal transaction from the company income wallet.
   * @param withdrawCompanyTransactionDto - Payload for the company withdrawal
   * @param user - Authenticated admin initiating the transaction
   * @returns Success ApiResponse containing the created transaction
   */
  async withdrawCompanyTransaction(
    withdrawCompanyTransactionDto: WithdrawCompanyTransactionDto,
    user: User,
  ): Promise<ApiResponse<{ transaction: TransactionResponseDto }>> {
    const companyIncomeWalletResponse = await this.walletService.getCompanyIncomeWallet();
    const companyIncomeWallet = companyIncomeWalletResponse.data!.wallet;

    if (companyIncomeWallet.balance < withdrawCompanyTransactionDto.amount) {
      throw new BadRequestException('Insufficient balance in company income wallet');
    }

    const newTransaction = await this.createTransaction({
      amount: withdrawCompanyTransactionDto.amount,
      description:
        withdrawCompanyTransactionDto.description ??
        `Withdraw ${withdrawCompanyTransactionDto.amount} from company income wallet`,
      type: TransactionType.WITHDRAW_COMPANY,
      fromWallet: companyIncomeWallet,
      initiator: user,
      entityId: companyIncomeWallet.id,
    });

    const reloaded = await this.reloadTransactionWithRelations(newTransaction);

    return ApiResponse.success<{ transaction: TransactionResponseDto }>('Company withdrawal requested successfully', {
      transaction: TransactionResponseDto.fromEntity(reloaded),
    });
  }

  /**
   * Creates a withdrawal transaction from the user's personal wallet.
   * @param withdrawPersonalTransactionDto - Payload for the personal withdrawal
   * @param user - Authenticated user initiating the transaction
   * @returns Success ApiResponse containing the created transaction
   */
  async withdrawPersonalTransaction(
    withdrawPersonalTransactionDto: WithdrawPersonalTransactionDto,
    user: User,
  ): Promise<ApiResponse<{ transaction: TransactionResponseDto }>> {
    const userWalletResponse = await this.walletService.getUserWallet(user.id);
    const userWallet = userWalletResponse.data!.wallet;

    if (userWallet.balance < withdrawPersonalTransactionDto.amount) {
      throw new BadRequestException('Insufficient balance in your wallet');
    }

    const newTransaction = await this.createTransaction({
      amount: withdrawPersonalTransactionDto.amount,
      description:
        withdrawPersonalTransactionDto.description ??
        `Withdraw ${withdrawPersonalTransactionDto.amount} from your personal wallet`,
      type: TransactionType.WITHDRAW_PERSONAL,
      fromWallet: userWallet,
      initiator: user,
      entityId: userWallet.id,
    });

    const reloaded = await this.reloadTransactionWithRelations(newTransaction);

    return ApiResponse.success<{ transaction: TransactionResponseDto }>('Personal withdrawal requested successfully', {
      transaction: TransactionResponseDto.fromEntity(reloaded),
    });
  }

  /**
   * Creates and adds a personal transaction to the current user wallet.
   * @param addPersonalTransactionDto - Payload for the new personal transaction
   * @param user - Authenticated user initiating the transaction
   * @returns Success ApiResponse containing the created transaction
   */
  async addPersonalTransaction(
    addPersonalTransactionDto: AddPersonalTransactionDto,
    user: User,
  ): Promise<ApiResponse<{ transaction: TransactionResponseDto }>> {
    const userWalletResponse = await this.walletService.getUserWallet(user.id);
    const userWallet = userWalletResponse.data!.wallet;

    const companyInvestmentWalletResponse = await this.walletService.getCompanyInvestmentWallet();
    const companyInvestmentWallet = companyInvestmentWalletResponse.data!.wallet;

    const newTransaction = await this.createTransaction({
      amount: addPersonalTransactionDto.amount,
      description:
        addPersonalTransactionDto.description ?? `Add ${addPersonalTransactionDto.amount} to your personal wallet`,
      type: TransactionType.ADD_PERSONAL,
      toWallet: userWallet,
      fromWallet: companyInvestmentWallet,
      initiator: user,
      entityId: userWallet.id,
    });

    const reloaded = await this.reloadTransactionWithRelations(newTransaction);

    return ApiResponse.success<{ transaction: TransactionResponseDto }>('Personal transaction added successfully', {
      transaction: TransactionResponseDto.fromEntity(reloaded),
    });
  }

  /**
   * Creates and adds a p2p transaction to the specified user's wallet.
   * @param addP2PTransactionDto - Payload for the new p2p transaction
   * @param user - Authenticated user initiating the transaction
   * @returns Success ApiResponse containing the created transaction
   */
  async addP2PTransaction(
    addP2PTransactionDto: AddP2PTransactionDto,
    user: User,
  ): Promise<ApiResponse<{ transaction: TransactionResponseDto }>> {
    const userFromWalletResponse = await this.walletService.getUserWallet(user.id);
    const userFromWallet = userFromWalletResponse.data!.wallet;

    if (userFromWallet.balance < addP2PTransactionDto.amount) {
      throw new BadRequestException('Insufficient balance in your wallet');
    }

    const userToWalletResponse = await this.walletService.getUserWallet(addP2PTransactionDto.toUserId);
    const userToWallet = userToWalletResponse.data!.wallet;

    if (!userToWallet) {
      throw new NotFoundException('Recipient wallet not found');
    }

    await this.ensureSufficientBalanceWithPendingTransactions(userFromWallet, addP2PTransactionDto.amount);

    userFromWallet.balance -= addP2PTransactionDto.amount;
    await this.walletService.saveWallet(userFromWallet);

    userToWallet.balance += addP2PTransactionDto.amount;
    await this.walletService.saveWallet(userToWallet);

    const newTransaction = await this.createTransaction({
      amount: addP2PTransactionDto.amount,
      description:
        addP2PTransactionDto.description ??
        `Add ${addP2PTransactionDto.amount} to ${addP2PTransactionDto.toUserId}'s personal wallet`,
      type: TransactionType.P2P,
      toWallet: userToWallet,
      fromWallet: userFromWallet,
      initiator: user,
      entityId: userFromWallet.id,
      status: TransactionStatus.APPROVED,
      statusUpdatedAt: new Date(),
      statusUpdatedBy: user.id,
      statusUpdater: user,
    });

    const reloaded = await this.reloadTransactionWithRelations(newTransaction);

    return ApiResponse.success<{ transaction: TransactionResponseDto }>('P2P transaction added successfully', {
      transaction: TransactionResponseDto.fromEntity(reloaded),
    });
  }

  /**
   * Ensures that the wallet has sufficient balance to perform the transaction.
   * @param wallet - Wallet to check the balance of
   * @param amount - Amount to check the balance against
   * @returns Promise that resolves to void
   * @throws BadRequestException if the wallet does not have sufficient balance
   */
  async ensureSufficientBalanceWithPendingTransactions(wallet: Wallet, amount: number): Promise<void> {
    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient balance in your wallet');
    }
    const pendingTransactionsAmount = await this.transactionRepository.sum('amount', {
      fromWalletId: wallet.id,
      status: TransactionStatus.PENDING,
    });
    if (pendingTransactionsAmount && pendingTransactionsAmount > wallet.balance - amount) {
      throw new BadRequestException('Insufficient balance in your wallet. You have pending transactions.');
    }
  }

  /**
   * Approves a pending transaction by marking its status as APPROVED.
   * @param transactionId - ID of the transaction to approve
   * @param user - User approving the transaction
   * @returns Success ApiResponse with the approved transaction
   */
  async approveTransaction(
    transactionId: number,
    user: User,
  ): Promise<ApiResponse<{ transaction: TransactionResponseDto }>> {
    const transaction = await this.findPendingTransactionById(transactionId);

    switch (transaction.type) {
      case TransactionType.ADD_COMPANY:
        await this.walletService.increaseCompanyInvestmentWalletBalance(transaction.amount);
        break;

      case TransactionType.ADD_PERSONAL:
        await this.walletService.decreaseCompanyInvestmentWalletBalance(transaction.amount);
        await this.applyWalletBalanceChange(transaction.toWallet, transaction.amount, 'credit');
        break;

      case TransactionType.WITHDRAW_COMPANY:
        await this.applyWalletBalanceChange(transaction.fromWallet, transaction.amount, 'debit');
        break;

      case TransactionType.WITHDRAW_PERSONAL:
        await this.applyWalletBalanceChange(transaction.fromWallet, transaction.amount, 'debit');
        break;

      default:
        throw new BadRequestException('Invalid transaction type');
    }

    return this.changeStatus(transaction, TransactionStatus.APPROVED, user);
  }

  /**
   * Rejects a pending transaction by marking its status as REJECTED.
   * @param transactionId - ID of the transaction to reject
   * @param user - User rejecting the transaction
   * @returns Success ApiResponse with the rejected transaction
   */
  async rejectTransaction(
    transactionId: number,
    user: User,
  ): Promise<ApiResponse<{ transaction: TransactionResponseDto }>> {
    const transaction = await this.findPendingTransactionById(transactionId);
    return this.changeStatus(transaction, TransactionStatus.REJECTED, user);
  }

  /**
   * Updates the status of a transaction and records status metadata.
   * @param transaction - Transaction to update
   * @param status - New status to be set
   * @param user - User performing the update
   * @returns Success ApiResponse containing the updated transaction
   */
  private async changeStatus(
    transaction: Transaction,
    status: TransactionStatus,
    user: User,
  ): Promise<ApiResponse<{ transaction: TransactionResponseDto }>> {
    transaction.status = status;
    transaction.statusUpdatedAt = new Date();
    transaction.statusUpdatedBy = user.id;
    transaction.statusUpdater = user;

    const updated = await this.transactionRepository.save(transaction);
    const reloaded = await this.reloadTransactionWithRelations(updated);

    return ApiResponse.success<{ transaction: TransactionResponseDto }>('Transaction status changed successfully', {
      transaction: TransactionResponseDto.fromEntity(reloaded),
    });
  }

  /**
   * Retrieves a pending transaction by its ID.
   * @param transactionId - ID of the pending transaction
   * @returns Transaction entity if found and pending
   * @throws NotFoundException if not found or not pending
   */
  private async findPendingTransactionById(transactionId: number): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId, status: TransactionStatus.PENDING },
      relations: ['toWallet', 'fromWallet', 'initiator'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found or not pending');
    }
    return transaction;
  }

  /**
   * Reloads the transaction with its main relations.
   * @param transaction - Saved transaction to reload
   * @returns Transaction entity with all specified relations loaded
   * @throws NotFoundException if transaction cannot be found
   */
  private async reloadTransactionWithRelations(transaction: Transaction): Promise<Transaction> {
    const loadedTransaction = await this.transactionRepository.findOne({
      where: { id: transaction.id },
      relations: ['initiator', 'statusUpdater'],
    });

    if (!loadedTransaction) {
      throw new NotFoundException('Transaction not found after reload');
    }
    return loadedTransaction;
  }

  /**
   * Applies a balance change to the provided wallet entity.
   * @param wallet - Wallet to update
   * @param amount - Amount to credit or debit
   * @param direction - Whether to credit or debit the wallet
   */
  private async applyWalletBalanceChange(
    wallet: Wallet | null | undefined,
    amount: number,
    direction: 'credit' | 'debit',
  ): Promise<void> {
    if (!wallet) {
      throw new BadRequestException('Wallet not associated with the transaction');
    }

    if (direction === 'debit' && wallet.balance < amount) {
      throw new BadRequestException('Insufficient wallet balance to approve transaction');
    }

    wallet.balance = direction === 'credit' ? wallet.balance + amount : wallet.balance - amount;
    await this.walletService.saveWallet(wallet);
  }
}
