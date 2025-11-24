import { Controller, Post, Body, Patch, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { AddCompanyTransactionDto, TransactionResponseDto } from './dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '../user/entities';
import { ApiResponse } from 'src/common/response/api.response';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { Admin } from 'src/common/decorators/admin.decorator';

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
  @Post('add:company')
  async addCompanyTransaction(
    @Body() addCompanyTransactionDto: AddCompanyTransactionDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<{ transaction: TransactionResponseDto }>> {
    return this.transactionService.addCompanyTransaction(addCompanyTransactionDto, user);
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
