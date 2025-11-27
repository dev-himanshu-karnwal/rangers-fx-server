import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { UserPackageService } from '../../packages/services/user-package.service';
import { BotsService } from '../../bots/bots.service';
import { BotActivation } from '../../bots/entities/bot-activation.entity';
import { User } from '../../user/entities/user.entity';
import { WorkRole } from '../../user/enums/user.enum';

/**
 * Bot Income Service - Handles all bot income calculation logic
 * Follows Single Responsibility Principle - handles bot income calculations only
 */
@Injectable()
export class BotIncomeService {
  constructor(
    @Inject(forwardRef(() => UserPackageService))
    private readonly userPackageService: UserPackageService,
    private readonly botsService: BotsService,
  ) {}

  /**
   * Calculates the maximum bot income for a user based on their work role
   * @param user - User entity with work role
   * @param userId - User ID
   * @returns Maximum bot income amount
   */
  async calculateMaxIncome(user: User, userId: number): Promise<number> {
    if (user.workRole === WorkRole.WORKER) {
      return await this.calculateWorkerBotMaxIncome(userId);
    }
    return await this.calculateInvestorBotMaxIncome(userId);
  }

  /**
   * Calculates the maximum bot income for an investor
   * Formula: Sum of (investmentAmount * package.returnCapital) for all in-progress packages
   * @param userId - User ID
   * @returns Maximum bot income for investor
   */
  async calculateInvestorBotMaxIncome(userId: number): Promise<number> {
    const packages = await this.userPackageService.getUserInProgressPackages(userId);
    return packages.reduce((sum, userPackage) => {
      const packageReturnCapital = Number(userPackage.package?.returnCapital ?? 0);
      return sum + Number(userPackage.investmentAmount ?? 0) * packageReturnCapital;
    }, 0);
  }

  /**
   * Calculates the maximum bot income for a worker
   * Formula: Total investment amount * 10 for all in-progress packages
   * @param userId - User ID
   * @returns Maximum bot income for worker
   */
  async calculateWorkerBotMaxIncome(userId: number): Promise<number> {
    const packages = await this.userPackageService.getUserInProgressPackages(userId);
    const totalAmount = packages.reduce((sum, userPackage) => sum + Number(userPackage.investmentAmount ?? 0), 0);
    return totalAmount * 10;
  }

  /**
   * Updates the bot max income for a user's active bot
   * @param user - User entity
   * @param bot - Bot activation entity
   * @returns Updated bot activation entity
   */
  async updateBotMaxIncome(user: User, bot: BotActivation): Promise<BotActivation> {
    const targetMaxIncome = await this.calculateMaxIncome(user, user.id);
    bot.maxIncome = targetMaxIncome;
    return await this.botsService.saveBot(bot);
  }

  /**
   * Updates the bot max income for a referrer's active bot
   * @param referrerId - Referrer user ID
   * @param bot - Bot activation entity
   * @returns Updated bot activation entity
   */
  async updateReferrerBotMaxIncome(referrerId: number, bot: BotActivation): Promise<BotActivation> {
    const referrerMaxIncome = await this.calculateWorkerBotMaxIncome(referrerId);
    bot.maxIncome = referrerMaxIncome;
    return await this.botsService.saveBot(bot);
  }
}
