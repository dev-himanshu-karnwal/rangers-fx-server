import { Controller } from '@nestjs/common';
import { WalletService } from './wallet.service';

/**
 * Wallet controller handling HTTP requests for wallet operations
 * Follows RESTful conventions
 */
@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  // TODO: Add wallet endpoints here
}
