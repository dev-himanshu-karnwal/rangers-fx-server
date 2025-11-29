import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { User } from '../../user/entities/user.entity';
import { BotActivation } from '../../bots/entities/bot-activation.entity';
import { BotsService } from '../../bots/bots.service';
import { UserService } from '../../user/user.service';
import { LevelsService } from '../../levels/levels.service';
import { WorkRole } from '../../user/enums/user.enum';
import { BotIncomeService } from '../../income/services/bot-income.service';

@Injectable()
export class UserPackagePostPurchaseService {
  constructor(
    private readonly userService: UserService,
    private readonly botsService: BotsService,
    private readonly levelsService: LevelsService,
    @Inject(forwardRef(() => BotIncomeService))
    private readonly botIncomeService: BotIncomeService,
  ) {}

  /**
   * Handles all domain side-effects that must happen once a package purchase succeeds.
   */
  async handlePostPurchaseSuccess(user: User, bot: BotActivation): Promise<void> {
    await this.updateCurrentUserBotMaxIncome(user, bot);
    await this.updateReferrerContext(user);
  }

  async ensureInvestorRoleAndLevel(user: User): Promise<User> {
    const shouldAssignLevel = user.workRole === WorkRole.NONE;
    const updatedUser = (await this.userService.updateUserRoleToInvestorIfNeeded(user)) ?? user;

    if (shouldAssignLevel) {
      await this.levelsService.assignLevelByHierarchy(updatedUser, 1);
    }

    return updatedUser;
  }

  private async updateCurrentUserBotMaxIncome(user: User, bot: BotActivation): Promise<void> {
    await this.botIncomeService.updateBotMaxIncome(user, bot);
  }

  async updateReferrerContext(user: User): Promise<void> {
    if (!user.referredByUserId) {
      return;
    }

    const referrer = await this.userService.findByIdEntity(user.referredByUserId);
    if (!referrer) {
      return;
    }

    // Use safe update method to avoid overwriting referrer's referredByUserId
    if (referrer.workRole !== WorkRole.WORKER) {
      await this.userService.updateWorkRole(referrer.id, WorkRole.WORKER);
    }

    const referrerBot = await this.botsService.getActiveBotActivation(referrer.id);
    if (!referrerBot) {
      return;
    }

    await this.botIncomeService.updateReferrerBotMaxIncome(referrer.id, referrerBot);
  }
}
