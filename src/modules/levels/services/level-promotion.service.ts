import { Injectable } from '@nestjs/common';
import { Level } from '../entities/level.entity';
import { UserLevel } from '../entities/user-level.entity';
import { LevelsService } from '../levels.service';
import { LevelConditionParserService } from './level-condition-parser.service';
import { ILevelConditionEvaluator } from './evaluators/level-condition-evaluator.interface';
import { BusinessConditionEvaluator } from './evaluators/business-condition.evaluator';
import { LevelsConditionEvaluator } from './evaluators/levels-condition.evaluator';
import { User } from '../../user/entities/user.entity';
import { UserService } from '../../user/user.service';

/**
 * Level Promotion Service
 * Single Responsibility: Handle level promotion logic for users
 */
@Injectable()
export class LevelPromotionService {
  private readonly evaluators: ILevelConditionEvaluator[];

  constructor(
    private readonly levelsService: LevelsService,
    private readonly conditionParser: LevelConditionParserService,
    private readonly businessEvaluator: BusinessConditionEvaluator,
    private readonly levelsEvaluator: LevelsConditionEvaluator,
    private readonly userService: UserService,
  ) {
    // Register all condition evaluators
    this.evaluators = [this.businessEvaluator, this.levelsEvaluator];
  }

  /**
   * Promotes a user to the highest eligible level if conditions are met
   * @param userId - User ID to check and promote
   * @returns True if user was promoted, false otherwise
   */
  async promoteUserIfEligible(userId: number): Promise<boolean> {
    const user = await this.userService.findByIdEntity(userId);
    if (!user) {
      return false;
    }

    const currentLevel = await this.levelsService.getUserCurrentLevel(userId);
    const allLevels = await this.levelsService.getAllLevelsOrdered();

    // Find highest eligible level above current
    const eligibleLevel = await this.findHighestEligibleLevel(user, currentLevel, allLevels);

    if (!eligibleLevel) {
      return false; // No eligible level found
    }

    const currentHierarchy = this.getHierarchy(currentLevel);
    if (eligibleLevel.hierarchy <= currentHierarchy) {
      return false; // Already at or above eligible level
    }

    // Promote user to eligible level
    await this.levelsService.assignLevelByHierarchy(user, eligibleLevel.hierarchy);
    return true; // User was promoted
  }

  /**
   * Finds the highest level a user is eligible for based on their conditions
   * @param user - User entity
   * @param currentLevel - User's current active level (or null)
   * @param allLevels - All available levels ordered by hierarchy
   * @returns Highest eligible level, or null if none found
   */
  private async findHighestEligibleLevel(
    user: User,
    currentLevel: UserLevel | null,
    allLevels: Level[],
  ): Promise<Level | null> {
    const currentHierarchy = this.getHierarchy(currentLevel);

    // Get all levels above current (ordered by hierarchy descending to find highest first)
    const candidateLevels = allLevels
      .filter((level) => level.hierarchy > currentHierarchy)
      .sort((a, b) => b.hierarchy - a.hierarchy); // Highest first

    // Check each level from highest to lowest
    for (const level of candidateLevels) {
      const isEligible = await this.checkLevelConditions(user.id, level);
      if (isEligible) {
        return level; // Return first (highest) eligible level
      }
    }

    return null; // No eligible level found
  }

  /**
   * Checks if a user meets all conditions for a specific level
   * @param userId - User ID
   * @param level - Level to check conditions for
   * @returns True if all conditions are met
   */
  private async checkLevelConditions(userId: number, level: Level): Promise<boolean> {
    // Parse conditions from JSON string
    const conditions = this.conditionParser.parseConditions(level.conditions);

    if (conditions.length === 0) {
      // No conditions means level is always eligible
      return true;
    }

    // Check all conditions - all must pass
    for (const condition of conditions) {
      const evaluator = this.findEvaluator(condition.type);
      if (!evaluator) {
        // Unknown condition type - fail this condition
        return false;
      }

      const conditionMet = await evaluator.evaluate(condition, userId, condition.scope);
      if (!conditionMet) {
        // At least one condition failed
        return false;
      }
    }

    // All conditions passed
    return true;
  }

  /**
   * Finds the appropriate evaluator for a condition type
   * @param conditionType - Condition type to find evaluator for
   * @returns Evaluator instance or null if not found
   */
  private findEvaluator(conditionType: string): ILevelConditionEvaluator | null {
    return this.evaluators.find((evaluator) => evaluator.canHandle(conditionType)) ?? null;
  }

  /**
   * Gets hierarchy number from a user level
   * @param userLevel - User level entity or null
   * @returns Hierarchy number, or 0 if no level
   */
  private getHierarchy(userLevel: UserLevel | null): number {
    if (!userLevel) {
      return 0;
    }

    if (userLevel.level?.hierarchy) {
      return userLevel.level.hierarchy;
    }

    return 0;
  }
}
