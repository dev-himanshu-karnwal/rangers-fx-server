import { Controller, Get, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { ApiResponse } from 'src/common/response/api.response';
import { WalletResponseDto } from './dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '../user/entities';

/**
 * Wallet controller handling HTTP requests for wallet operations
 * Follows RESTful conventions
 */
@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  /**
   * Get current authenticated user's wallet
   * @param user - Current authenticated user (injected by @CurrentUser)
   * @returns ApiResponse containing the user's wallet DTO
   */
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  async getCurrentUserWallet(@CurrentUser() user: User): Promise<ApiResponse<{ wallet: WalletResponseDto }>> {
    return await this.walletService.getCurrentUserWallet(user);
  }

  /**
   * Get the company's income wallet
   * @returns ApiResponse containing the company income wallet DTO
   */
  @Get('company-income')
  async getCompanyIncome(): Promise<ApiResponse<{ wallet: WalletResponseDto }>> {
    return this.walletService.getCompanyIncomeWallet();
  }

  /**
   * Get the company's investment wallet
   * @returns ApiResponse containing the company investment wallet DTO
   */
  @Get('company-investment')
  async getCompanyInvestment(): Promise<ApiResponse<{ wallet: WalletResponseDto }>> {
    return this.walletService.getCompanyInvestmentWallet();
  }
}
