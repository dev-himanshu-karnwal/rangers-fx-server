import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
  Get,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import {
  AddCompanyTransactionDto,
  AddPersonalTransactionDto,
  AdminTransferToPersonalDto,
  TransactionResponseDto,
  AddP2PTransactionDto,
  WithdrawCompanyTransactionDto,
  WithdrawPersonalTransactionDto,
} from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../user/entities';
import { ApiResponse } from '../../common/response/api.response';
import { AdminGuard } from '../../common/guards/admin.guard';
import { Admin } from '../../common/decorators/admin.decorator';
import { QueryParamsDto } from '../../common/query';
import { QueryValidationPipe } from '../../common/pipes/query-validation.pipe';

/**
 * Transaction controller - handles transaction-related HTTP requests
 */
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  /**
   * Adds a new company transaction.
   * @param addCompanyTransactionDto - Data for the new company transaction
   * @param user - The current authenticated user
   * @returns ApiResponse containing the newly created transaction
   */
  @UseGuards(AdminGuard)
  @Admin()
  @Post('company')
  async addCompanyTransaction(
    @Body() addCompanyTransactionDto: AddCompanyTransactionDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<{ transaction: TransactionResponseDto }>> {
    return this.transactionService.addCompanyTransaction(addCompanyTransactionDto, user);
  }

  /**
   * Retrieves paginated transactions where the current user's wallet participated.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllTransactions(
    @CurrentUser() user: User,
    @Query(new QueryValidationPipe()) query: QueryParamsDto,
  ): Promise<
    ApiResponse<{
      meta: { total: number; page: number; limit: number };
      transactions: TransactionResponseDto[];
    }>
  > {
    return this.transactionService.getAllTransactions(user, query);
  }

  /**
   * Adds a new user transaction.
   * @param addPersonalTransactionDto - Data for the new personal transaction
   * @param user - The current authenticated user
   * @returns ApiResponse containing the newly created personal transaction
   */
  @Post('personal')
  async addPersonalTransaction(
    @Body() addPersonalTransactionDto: AddPersonalTransactionDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<{ transaction: TransactionResponseDto }>> {
    return this.transactionService.addPersonalTransaction(addPersonalTransactionDto, user);
  }

  /**
   * Creates a withdrawal request from the company income wallet.
   * @param withdrawCompanyTransactionDto - Data for the new company withdrawal
   * @param user - The current authenticated admin user
   * @returns ApiResponse containing the newly created withdrawal transaction
   */
  @UseGuards(AdminGuard)
  @Admin()
  @Post('company/withdraw')
  async withdrawCompanyTransaction(
    @Body() withdrawCompanyTransactionDto: WithdrawCompanyTransactionDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<{ transaction: TransactionResponseDto }>> {
    return this.transactionService.withdrawCompanyTransaction(withdrawCompanyTransactionDto, user);
  }

  /**
   * Creates a withdrawal request for the authenticated user's personal wallet.
   * @param withdrawPersonalTransactionDto - Data for the new personal withdrawal
   * @param user - The current authenticated user
   * @returns ApiResponse containing the newly created withdrawal transaction
   */
  @Post('personal/withdraw')
  async withdrawPersonalTransaction(
    @Body() withdrawPersonalTransactionDto: WithdrawPersonalTransactionDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<{ transaction: TransactionResponseDto }>> {
    return this.transactionService.withdrawPersonalTransaction(withdrawPersonalTransactionDto, user);
  }

  /**
   * Adds a new p2p transaction.
   * @param addP2PTransactionDto - Data for the new p2p transaction
   * @param user - The current authenticated user
   * @returns ApiResponse containing the newly created p2p transaction
   */
  @Post('p2p')
  async addP2PTransaction(
    @Body() addP2PTransactionDto: AddP2PTransactionDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<{ transaction: TransactionResponseDto }>> {
    return this.transactionService.addP2PTransaction(addP2PTransactionDto, user);
  }

  /**
   * Transfers amount from company investment wallet to a user's personal wallet.
   * Admin-only operation that can directly approve the payment.
   * @param adminTransferToPersonalDto - Data for the admin transfer
   * @param user - The current authenticated admin user
   * @returns ApiResponse containing the newly created transaction
   */
  @UseGuards(AdminGuard)
  @Admin()
  @Post('c2p')
  async adminTransferToPersonal(
    @Body() adminTransferToPersonalDto: AdminTransferToPersonalDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<{ transaction: TransactionResponseDto }>> {
    return this.transactionService.adminTransferToPersonal(adminTransferToPersonalDto, user);
  }

  /**
   * Approves a pending transaction.
   * @param transactionId - The ID of the transaction to approve
   * @param user - The current authenticated user
   * @returns ApiResponse containing the approved transaction
   */
  @UseGuards(AdminGuard)
  @Admin()
  @Patch(':id/status/approve')
  async approveTransaction(
    @Param('id', ParseIntPipe) transactionId: number,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<{ transaction: TransactionResponseDto }>> {
    return this.transactionService.approveTransaction(transactionId, user);
  }

  /**
   * Rejects a pending transaction.
   * @param transactionId - The ID of the transaction to reject
   * @param user - The current authenticated user
   * @returns ApiResponse containing the rejected transaction
   */
  @UseGuards(AdminGuard)
  @Admin()
  @Patch(':id/status/reject')
  async rejectTransaction(
    @Param('id', ParseIntPipe) transactionId: number,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<{ transaction: TransactionResponseDto }>> {
    return this.transactionService.rejectTransaction(transactionId, user);
  }
}
