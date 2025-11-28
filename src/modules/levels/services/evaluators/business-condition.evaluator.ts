import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../user/entities/user.entity';
import { ILevelConditionEvaluator } from './level-condition-evaluator.interface';
import { LevelCondition } from '../../interfaces/level-condition.interface';
import { LevelConditionType } from '../../enums/level-condition-type.enum';
import { UserClosureService } from '../../../user/closure/closure.service';
import { LevelConditionScope } from '../../enums';

/**
 * Business Condition Evaluator
 * Single Responsibility: Evaluate BUSINESS type level conditions
 */
@Injectable()
export class BusinessConditionEvaluator implements ILevelConditionEvaluator {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userClosureService: UserClosureService,
  ) {}

  canHandle(conditionType: string): boolean {
    return conditionType === LevelConditionType.BUSINESS;
  }

  async evaluate(condition: LevelCondition, userId: number, scope: LevelConditionScope): Promise<boolean> {
    if (!this.canHandle(condition.type)) {
      return false;
    }

    const requiredBusiness = condition.value;
    const actualBusiness = await this.getBusinessDone(userId, scope);

    return actualBusiness >= requiredBusiness;
  }

  /**
   * Gets business done amount for a user based on scope
   * @param userId - User ID
   * @param scope - DIRECT (direct downline only, depth=1) or NETWORK (all descendants, depth>0)
   * @returns Total business done amount (self is never included)
   */
  private async getBusinessDone(userId: number, scope: LevelConditionScope): Promise<number> {
    if (scope === LevelConditionScope.DIRECT) {
      return this.getDirectBusinessDone(userId);
    }

    return this.getNetworkBusinessDone(userId);
  }

  /**
   * Gets business done for direct downline only (DIRECT scope)
   * DIRECT = descendants with depth = 1 (excluding self)
   * @param userId - User ID
   * @returns Sum of business done for direct downline users
   */
  private async getDirectBusinessDone(userId: number): Promise<number> {
    // Get direct descendants (depth = 1, excluding self)
    const directDescendants = await this.userClosureService.getAllDirectDescendentsOfUser(userId);
    const directDescendantIds = directDescendants.map((d) => d.descendantId);

    if (directDescendantIds.length === 0) {
      return 0;
    }

    // Sum business done for direct descendants only
    const { sum } = await this.userRepository
      .createQueryBuilder('user')
      .select('SUM(user.businessDone)', 'sum')
      .where('user.id IN (:...ids)', { ids: directDescendantIds })
      .getRawOne();

    return Number(sum) || 0;
  }

  /**
   * Gets business done for all network users below the user (NETWORK scope)
   * NETWORK = all descendants with depth > 0 (excluding self)
   * @param userId - User ID
   * @returns Sum of business done for all network users (excluding self)
   */
  private async getNetworkBusinessDone(userId: number): Promise<number> {
    // Get all descendants (excluding self - depth > 0)
    const descendants = await this.userClosureService.getAllDescendentsOfUser(userId);
    // Filter out self (depth = 0)
    const networkDescendants = descendants.filter((d) => d.depth > 0);
    const networkDescendantIds = networkDescendants.map((d) => d.descendantId);

    if (networkDescendantIds.length === 0) {
      return 0;
    }

    // Sum business done for all network descendants (excluding self)
    const { sum } = await this.userRepository
      .createQueryBuilder('user')
      .select('SUM(user.businessDone)', 'sum')
      .where('user.id IN (:...ids)', { ids: networkDescendantIds })
      .getRawOne();

    return Number(sum) || 0;
  }
}
