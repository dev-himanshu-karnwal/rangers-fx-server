import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { UserLevel } from '../../entities/user-level.entity';
import { ILevelConditionEvaluator } from './level-condition-evaluator.interface';
import { LevelCondition } from '../../interfaces/level-condition.interface';
import { LevelConditionType } from '../../enums/level-condition-type.enum';
import { LevelConditionScope } from '../../enums';
import { UserClosureService } from '../../../user/closure/closure.service';
import { LevelsService } from '../../levels.service';
import { UserClosure } from '../../../user/closure/entities/closure.entity';

/**
 * Levels Condition Evaluator
 * Single Responsibility: Evaluate LEVELS type level conditions (count users at specific level)
 */
@Injectable()
export class LevelsConditionEvaluator implements ILevelConditionEvaluator {
  constructor(
    @InjectRepository(UserLevel)
    private readonly userLevelRepository: Repository<UserLevel>,
    @InjectRepository(UserClosure)
    private readonly userClosureRepository: Repository<UserClosure>,
    private readonly userClosureService: UserClosureService,
    private readonly levelsService: LevelsService,
  ) {}

  canHandle(conditionType: string): boolean {
    return conditionType === LevelConditionType.LEVELS;
  }

  async evaluate(condition: LevelCondition, userId: number, scope: LevelConditionScope): Promise<boolean> {
    if (!this.canHandle(condition.type)) {
      return false;
    }

    if (!condition.level) {
      return false; // LEVELS condition requires a target level
    }

    const requiredCount = condition.value;
    const targetLevelHierarchy = condition.level;
    const actualCount = await this.countUsersAtLevel(userId, targetLevelHierarchy, scope);

    return actualCount >= requiredCount;
  }

  /**
   * Counts users at a specific level hierarchy based on scope
   * @param userId - User ID
   * @param targetLevelHierarchy - Target level hierarchy to count
   * @param scope - DIRECT (only direct referrals) or NETWORK (all descendants)
   * @returns Count of users at the target level
   */
  private async countUsersAtLevel(
    userId: number,
    targetLevelHierarchy: number,
    scope: LevelConditionScope,
  ): Promise<number> {
    if (scope === LevelConditionScope.DIRECT) {
      return this.countDirectUsersAtLevel(userId, targetLevelHierarchy);
    }

    return this.countNetworkUsersAtLevel(userId, targetLevelHierarchy);
  }

  /**
   * Counts direct referrals at a specific level hierarchy
   * Counts distinct branches (by rootChildId) that have at least one user at target level
   * @param userId - User ID
   * @param targetLevelHierarchy - Target level hierarchy
   * @returns Count of distinct branches with users at target level
   */
  private async countDirectUsersAtLevel(userId: number, targetLevelHierarchy: number): Promise<number> {
    // Get direct descendants (depth = 1)
    const directDescendants = await this.userClosureService.getAllDirectDescendentsOfUser(userId);
    const directDescendantIds = directDescendants.map((d) => d.descendantId);

    if (directDescendantIds.length === 0) {
      return 0;
    }

    // Get target level entity
    const targetLevel = await this.levelsService.getByHierarchy(targetLevelHierarchy);

    // Count direct descendants with active level matching target level
    return await this.userLevelRepository.count({
      where: {
        userId: In(directDescendantIds),
        levelId: targetLevel.id,
        endDate: IsNull(),
      },
    });
  }

  /**
   * Counts all network users (descendants) at a specific level hierarchy
   * Counts distinct branches (by rootChildId) that have at least one user at target level
   * NETWORK = all descendants with depth > 0 (excluding self)
   * @param userId - User ID
   * @param targetLevelHierarchy - Target level hierarchy
   * @returns Count of distinct branches with users at target level (excluding self)
   */
  private async countNetworkUsersAtLevel(userId: number, targetLevelHierarchy: number): Promise<number> {
    // Get target level entity
    const targetLevel = await this.levelsService.getByHierarchy(targetLevelHierarchy);

    // Use query builder to join UserClosure with UserLevel and count distinct branches
    const result = await this.userClosureRepository
      .createQueryBuilder('uc')
      .innerJoin(
        'user_levels',
        'ul',
        'ul.user_id = uc.descendant_id AND ul.level_id = :levelId AND ul.end_date IS NULL',
        { levelId: targetLevel.id },
      )
      .where('uc.ancestor_id = :userId', { userId })
      .andWhere('uc.depth > 0') // Exclude self
      .andWhere('uc.root_child_id IS NOT NULL') // Only count valid branches
      .select('COUNT(DISTINCT uc.root_child_id)', 'count')
      .getRawOne();

    return result ? parseInt(result.count, 10) : 0;
  }
}
