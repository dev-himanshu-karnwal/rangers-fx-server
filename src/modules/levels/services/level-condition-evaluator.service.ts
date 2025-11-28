import { Injectable } from '@nestjs/common';
import { UserClosureService } from '../../user/closure/closure.service';
import { LevelPromotionService } from './level-promotion.service';

/**
 * Level Condition Evaluator Service (Orchestrator)
 * Single Responsibility: Orchestrate level condition checking and promotion for users and their ancestors
 */
@Injectable()
export class LevelConditionEvaluatorService {
  constructor(
    private readonly userClosureService: UserClosureService,
    private readonly levelPromotionService: LevelPromotionService,
  ) {}

  /**
   * Checks and promotes a user and all their ancestors sequentially and recursively
   * Processes ancestors one by one up the chain, and recursively checks ancestors of promoted users
   * @param userId - User ID who received income (triggers the check)
   */
  async checkAndPromoteAncestors(userId: number): Promise<void> {
    // 1. Check and promote the user themselves first
    const wasPromoted = await this.levelPromotionService.promoteUserIfEligible(userId);

    // 2. Get ancestors ordered by depth (closest first: depth 1, 2, 3...)
    const ancestors = await this.userClosureService.getAllAscendentsOfUser(userId, true);
    const sortedAncestors = ancestors.sort((a, b) => a.depth - b.depth);

    // 3. Process each ancestor sequentially (one by one, up the chain)
    for (const ancestor of sortedAncestors) {
      // Check and promote this ancestor
      const ancestorWasPromoted = await this.levelPromotionService.promoteUserIfEligible(ancestor.ancestorId);

      // 4. If this ancestor was promoted, recursively check THEIR ancestors
      // This ensures cascading promotions: C promoted → B's conditions now pass → B promoted → A's conditions checked
      if (ancestorWasPromoted) {
        await this.checkAndPromoteAncestors(ancestor.ancestorId); // Recursive call
      }
    }
  }

  /**
   * Checks and promotes a single user (without checking ancestors)
   * @param userId - User ID to check
   */
  async checkAndPromoteUser(userId: number): Promise<void> {
    await this.levelPromotionService.promoteUserIfEligible(userId);
  }
}
