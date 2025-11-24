import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { ApiResponse } from 'src/common/response/api.response';
import { WalletResponseDto } from './dto';
import { UserService } from '../user/user.service';
import { User } from '../user/entities';
import { WalletType } from './enums';

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
  /**
   * Create a new wallet for a user
   * @param userId - ID of the user to create the wallet for
   * @returns The created Wallet entity
   */
  async createWallet(userId: number): Promise<Wallet> {
    const wallet = this.walletRepository.create({ userId });
    return this.walletRepository.save(wallet);
  }

  /**
   * Fetch the wallet for the current authenticated user
   * @param user - Current authenticated user (passed from controller)
   * @returns ApiResponse containing the user's wallet DTO
   */
  async getUserWallet(user: User): Promise<ApiResponse<{ wallet: WalletResponseDto }>> {
    const currentUser = this.userService.getMe(user);
    const wallet = await this.walletRepository.findOne({ where: { userId: currentUser.data?.user.id } });
    if (!wallet) {
      throw new NotFoundException('Current User wallet Not found.');
    }
    return ApiResponse.success('Wallet fetched Successfully.', { wallet: new WalletResponseDto(wallet) });
  }

  /**
   * Fetch the company's income wallet
   * @returns ApiResponse containing the company income wallet DTO
   */
  async getCompanyIncomeWallet(): Promise<ApiResponse<{ wallet: WalletResponseDto }>> {
    const wallet = await this.walletRepository.findOne({ where: { walletType: Equal(WalletType.COMPANY_INCOME) } });
    if (!wallet) {
      throw new NotFoundException('Company income wallet not found.');
    }
    return ApiResponse.success('Company income fetched successfully.', { wallet: new WalletResponseDto(wallet) });
  }

  /**
   * Fetch the company's investment wallet
   * @returns ApiResponse containing the company investment wallet DTO
   */
  async getCompanyInvestmentWallet(): Promise<ApiResponse<{ wallet: WalletResponseDto }>> {
    const wallet = await this.walletRepository.findOne({ where: { walletType: Equal(WalletType.COMPANY_INVESTMENT) } });
    if (!wallet) {
      throw new NotFoundException('Company investment wallet not found.');
    }
    return ApiResponse.success('Company investment fetched successfully.', { wallet: new WalletResponseDto(wallet) });
  }

  /**
   * Increases the balance of the company investment wallet by the specified amount.
   * @param amount - The amount to increase the balance by
   * @returns Promise that resolves to the updated Wallet entity
   */
  async increaseCompanyInvestmentWalletBalance(amount: number): Promise<Wallet> {
    const walletResponse = await this.getCompanyInvestmentWallet();
    const wallet = walletResponse.data!.wallet;
    wallet.balance += amount;
    return await this.walletRepository.save(wallet);
  }

  /**
   * Decreases the balance of the company investment wallet by the specified amount.
   * @param amount - The amount to decrease the balance by
   * @returns Promise that resolves to the updated Wallet entity
   */
  async decreaseCompanyInvestmentWalletBalance(amount: number): Promise<Wallet> {
    const walletResponse = await this.getCompanyInvestmentWallet();
    const wallet = walletResponse.data!.wallet;

    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient balance in company investment wallet');
    }

    wallet.balance -= amount;
    return await this.walletRepository.save(wallet);
  }

  /**
   * Increases the balance of the personal wallet by the specified amount.
   * @param amount - The amount to increase the balance by
   * @param user - The user to increase the balance for
   * @returns Promise that resolves to the updated Wallet entity
   */
  async increasePersonalWalletBalance(amount: number, user: User): Promise<Wallet> {
    const walletResponse = await this.getUserWallet(user);
    const wallet = walletResponse.data!.wallet;
    wallet.balance += amount;
    return await this.walletRepository.save(wallet);
  }
}
