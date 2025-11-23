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

  // TODO: Add wallet endpoints here
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  async getCurrentUserWallet(@CurrentUser() user: User): Promise<ApiResponse<{ wallet: WalletResponseDto }>> {
    return await this.walletService.getCurrentUserWallet(user);
  }
}
