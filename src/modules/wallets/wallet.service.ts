import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { ApiResponse } from 'src/common/response/api.response';
import { WalletResponseDto } from './dto';
import { UserService } from '../user/user.service';
import { User } from '../user/entities';

/**
 * Wallet service handling business logic for wallet operations
 * Follows Single Responsibility Principle - handles wallet-related business logic only
 */
@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  async createWallet(userId: number): Promise<Wallet> {
    const wallet = this.walletRepository.create({ userId });
    return this.walletRepository.save(wallet);
  }

  async getCurrentUserWallet(user: User): Promise<ApiResponse<{ wallet: WalletResponseDto }>> {
    const currentUser = this.userService.getMe(user);
    const wallet = await this.walletRepository.findOne({ where: { userId: currentUser.data?.user.id } });
    if (!wallet) {
      throw new NotFoundException('Current User wallet Not found.');
    }
    return ApiResponse.success('Wallet fetched Successfully.', { wallet: new WalletResponseDto(wallet) });
  }
}
