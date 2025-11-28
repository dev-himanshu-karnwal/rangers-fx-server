import { LevelConditionScope } from '../../enums';
import { LevelCondition } from '../../interfaces/level-condition.interface';

/**
 * Interface for level condition evaluators
 * Strategy pattern - allows different condition types to have their own evaluation logic
 */
export interface ILevelConditionEvaluator {
  /**
   * Evaluates a level condition for a given user
   * @param condition - The condition to evaluate
   * @param userId - User ID to evaluate condition for
   * @param scope - Scope of the condition (DIRECT or NETWORK)
   * @returns True if condition is met, false otherwise
   */
  evaluate(condition: LevelCondition, userId: number, scope: LevelConditionScope): Promise<boolean>;

  /**
   * Checks if this evaluator can handle the given condition type
   * @param conditionType - The condition type to check
   * @returns True if this evaluator can handle the condition type
   */
  canHandle(conditionType: string): boolean;
}
