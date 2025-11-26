import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPackage } from '../entities/user-package.entity';
import { UserPackageStatus } from '../enums';
import { User } from 'src/modules/user/entities/user.entity';
import { BotActivation } from 'src/modules/bots/entities/bot-activation.entity';
import { BotsService } from 'src/modules/bots/bots.service';
import { UserService } from 'src/modules/user/user.service';
import { LevelsService } from 'src/modules/levels/levels.service';
import { WorkRole } from 'src/modules/user/enums/user.enum';

@Injectable()
export class UserPackagePostPurchaseService {
  constructor(
    @InjectRepository(UserPackage)
    private readonly userPackageRepository: Repository<UserPackage>,
    private readonly userService: UserService,
    private readonly botsService: BotsService,
    private readonly levelsService: LevelsService,
  ) {}

  /**
   * Handles all domain side-effects that must happen once a package purchase succeeds.
   */
  async handlePostPurchaseSuccess(user: User, bot: BotActivation): Promise<void> {
    const userWithRole = await this.ensureInvestorRoleAndLevel(user);
    await this.updateCurrentUserBotMaxIncome(userWithRole, bot);
    await this.updateReferrerContext(userWithRole);
  }

  private async ensureInvestorRoleAndLevel(user: User): Promise<User> {
    const shouldAssignLevel = user.workRole === WorkRole.NONE;
    const updatedUser = (await this.userService.updateUserRoleToInvestorIfNeeded(user)) ?? user;

    if (shouldAssignLevel) {
      await this.levelsService.assignLevelByHierarchy(updatedUser, 1);
    }

    return updatedUser;
  }

  private async updateCurrentUserBotMaxIncome(user: User, bot: BotActivation): Promise<void> {
    const targetMaxIncome =
      user.workRole === WorkRole.WORKER
        ? await this.calculateWorkerBotMaxIncome(user.id)
        : await this.calculateInvestorBotMaxIncome(user.id);

    bot.maxIncome = targetMaxIncome;
    await this.botsService.saveBot(bot);
  }

  private async updateReferrerContext(user: User): Promise<void> {
    if (!user.referredByUserId) {
      return;
    }

    const referrer = await this.userService.findByIdEntity(user.referredByUserId);
    if (!referrer) {
      return;
    }

    if (referrer.workRole !== WorkRole.WORKER) {
      referrer.workRole = WorkRole.WORKER;
      await this.userService.saveUser(referrer);
    }

    const referrerBot = await this.botsService.getActiveBotActivation(referrer.id);
    if (!referrerBot) {
      return;
    }

    const referrerMaxIncome = await this.calculateWorkerBotMaxIncome(referrer.id);
    referrerBot.maxIncome = referrerMaxIncome;
    await this.botsService.saveBot(referrerBot);
  }

  private async calculateInvestorBotMaxIncome(userId: number): Promise<number> {
    const packages = await this.getUserInProgressPackages(userId);
    return packages.reduce((sum, userPackage) => {
      const packageReturnCapital = Number(userPackage.package?.returnCapital ?? 0);
      return sum + Number(userPackage.investmentAmount ?? 0) * packageReturnCapital;
    }, 0);
  }

  private async calculateWorkerBotMaxIncome(userId: number): Promise<number> {
    const packages = await this.getUserInProgressPackages(userId);
    const totalAmount = packages.reduce((sum, userPackage) => sum + Number(userPackage.investmentAmount ?? 0), 0);
    return totalAmount * 10;
  }

  private async getUserInProgressPackages(userId: number): Promise<UserPackage[]> {
    const inProgressPackages = await this.userPackageRepository.find({
      where: { userId, status: UserPackageStatus.INPROGRESS },
      relations: ['package'],
    });
    return inProgressPackages;
  }
}
