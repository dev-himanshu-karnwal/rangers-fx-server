import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPackage } from '../entities/user-package.entity';
import { Package } from '../entities/package.entity';
import { PurchasePackageDto } from '../dto/purchase-package.dto';
import { UserPackageResponseDto } from '../dto/user-package-response.dto';
import { ApiResponse } from 'src/common/response/api.response';
import { User } from '../../user/entities/user.entity';
import { WalletService } from '../../wallets/wallet.service';
import { TransactionService } from '../../transactions/transaction.service';
import { BotsService } from '../../bots/bots.service';
import { TransactionStatus, TransactionType } from 'src/modules/transactions/enums';

@Injectable()
export class UserPackageService {
  constructor(
    @InjectRepository(UserPackage)
    private readonly userPackageRepository: Repository<UserPackage>,
    @InjectRepository(Package)
    private readonly packageRepository: Repository<Package>,
    private readonly walletService: WalletService,
    private readonly transactionService: TransactionService,
    private readonly botsService: BotsService,
  ) {}

  /**
   * Purchases a package for a user
   * Automatically fetches the active bot activation for the user if one exists
   * @param user - The user purchasing the package
   * @param purchasePackageDto - DTO containing packageId and investmentAmount
   * @returns ApiResponse containing the created user package
   */
  async purchasePackage(
    user: User,
    purchasePackageDto: PurchasePackageDto,
  ): Promise<ApiResponse<{ userPackage: UserPackageResponseDto }>> {
    // Validate package exists
    const pkg = await this.packageRepository.findOneBy({ id: purchasePackageDto.packageId });
    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    // Validate investment amount is within package min/max range
    if (purchasePackageDto.investmentAmount < pkg.minPrice || purchasePackageDto.investmentAmount > pkg.maxPrice) {
      throw new BadRequestException(`Investment amount must be between ${pkg.minPrice} and ${pkg.maxPrice}`);
    }

    // Get company income wallet
    const companyIncomeWalletResponse = await this.walletService.getCompanyIncomeWallet();
    const companyIncomeWallet = companyIncomeWalletResponse.data?.wallet;

    if (!companyIncomeWallet) {
      throw new NotFoundException('Company income wallet not found');
    }

    // Get user wallet entity
    const userWalletResponse = await this.walletService.getUserWallet(user.id);
    const userWallet = userWalletResponse.data?.wallet;

    if (!userWallet) {
      throw new NotFoundException('User wallet not found');
    }

    // Check sufficient balance considering pending transactions
    await this.transactionService.ensureSufficientBalanceWithPendingTransactions(
      userWallet,
      purchasePackageDto.investmentAmount,
    );

    // Get active bot activation for the user
    const bot = await this.botsService.getActiveBotActivation(user.id);
    if (!bot) {
      throw new NotFoundException('No active bot activation found for the user');
    }

    // Create user package record
    const userPackage = this.userPackageRepository.create({
      user,
      package: pkg,
      bot,
      investmentAmount: purchasePackageDto.investmentAmount,
      purchaseDate: new Date(),
    });

    const savedUserPackage = await this.userPackageRepository.save(userPackage);

    await this.transactionService.createTransaction({
      fromWalletId: userWallet.id,
      toWalletId: companyIncomeWallet.id,
      amount: purchasePackageDto.investmentAmount,
      description: `Purchase of package ${pkg.title} by ${user.fullName} for ${purchasePackageDto.investmentAmount}`,
      type: TransactionType.PURCHASE_PACKAGE,
      status: TransactionStatus.APPROVED,
      entityId: savedUserPackage.id,
      initiator: user,
      statusUpdatedAt: new Date(),
      statusUpdatedBy: user.id,
      statusUpdater: user,
    });

    userWallet.balance -= purchasePackageDto.investmentAmount;
    companyIncomeWallet.balance += purchasePackageDto.investmentAmount;

    const savedUserWallet = await this.walletService.saveWallet(userWallet);
    const savedCompanyIncomeWallet = await this.walletService.saveWallet(companyIncomeWallet);

    // Reload with relations for response
    const userPackageWithRelations = await this.userPackageRepository.findOne({
      where: { id: savedUserPackage.id },
      relations: ['user', 'package', 'bot'],
    });

    if (!userPackageWithRelations) {
      throw new NotFoundException('User package not found after creation');
    }

    return ApiResponse.success('Package purchased successfully', {
      userPackage: UserPackageResponseDto.fromEntity(userPackageWithRelations),
    });
  }
}
