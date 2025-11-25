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
   * Fetch the wallet for the given user
   * @param userId - User ID to fetch the wallet for
   * @returns ApiResponse containing the user's wallet DTO
   */
  async getUserWallet(userId: number): Promise<ApiResponse<{ wallet: WalletResponseDto }>> {
    const wallet = await this.walletRepository.findOne({ where: { userId } });
    if (!wallet) {
      throw new NotFoundException(`User with ID ${userId} wallet not found.`);
    }
    return ApiResponse.success('Wallet fetched Successfully.', { wallet: new WalletResponseDto(wallet) });
  }

  private async getCompanyWallet(
    walletType: 'income' | 'investment',
  ): Promise<ApiResponse<{ wallet: WalletResponseDto }>> {
    const walletResponse = await this.walletRepository.findOne({
      where: { walletType: walletType === 'income' ? WalletType.COMPANY_INCOME : WalletType.COMPANY_INVESTMENT },
    });
    if (!walletResponse) {
      throw new NotFoundException(`${walletType} wallet not found.`);
    }
    return ApiResponse.success(`${walletType} fetched successfully.`, {
      wallet: new WalletResponseDto(walletResponse),
    });
  }

  /**
   * Fetch the company's income wallet
   * @returns ApiResponse containing the company income wallet DTO
   */
  async getCompanyIncomeWallet(): Promise<ApiResponse<{ wallet: WalletResponseDto }>> {
    return this.getCompanyWallet('income');
  }

  /**
   * Fetch the company's investment wallet
   * @returns ApiResponse containing the company investment wallet DTO
   */
  async getCompanyInvestmentWallet(): Promise<ApiResponse<{ wallet: WalletResponseDto }>> {
    return this.getCompanyWallet('investment');
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
    const walletResponse = await this.getUserWallet(user.id);
    const wallet = walletResponse.data!.wallet;
    wallet.balance += amount;
    return await this.walletRepository.save(wallet);
  }

  /**
   * Updates the wallet.
   * @param wallet - The wallet to save
   * @returns Promise that resolves to the updated Wallet entity
   */
  async saveWallet(wallet: Wallet): Promise<Wallet> {
    return await this.walletRepository.save(wallet);
  }

  /**
   * Transfers amount between two wallets and saves both
   * @param fromWallet - Source wallet (will be decreased)
   * @param toWallet - Destination wallet (will be increased)
   * @param amount - Amount to transfer
   * @returns Promise that resolves when both wallets are saved
   */
  async transferBetweenWallets(fromWallet: Wallet, toWallet: Wallet, amount: number): Promise<void> {
    fromWallet.balance -= amount;
    toWallet.balance += amount;

    await this.saveWallet(fromWallet);
    await this.saveWallet(toWallet);
  }
}
