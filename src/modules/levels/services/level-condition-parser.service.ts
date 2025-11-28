import { Injectable } from '@nestjs/common';
import { LevelCondition } from '../interfaces/level-condition.interface';

/**
 * Level Condition Parser Service
 * Single Responsibility: Parse JSON conditions string to LevelCondition array
 */
@Injectable()
export class LevelConditionParserService {
  /**
   * Parses a JSON string containing level conditions into an array of LevelCondition objects
   * @param conditionsString - JSON string from level.conditions field
   * @returns Array of parsed LevelCondition objects, or empty array if invalid/empty
   */
  parseConditions(conditionsString: string): LevelCondition[] {
    if (!conditionsString || conditionsString.trim() === '') {
      return [];
    }

    try {
      const parsed = JSON.parse(conditionsString);

      // Handle array of conditions
      if (Array.isArray(parsed)) {
        return parsed.filter((condition): condition is LevelCondition => this.isValidCondition(condition));
      }

      // Handle single condition object
      if (this.isValidCondition(parsed)) {
        return [parsed];
      }

      return [];
    } catch (error) {
      // Invalid JSON - return empty array
      return [];
    }
  }

  /**
   * Validates if an object is a valid LevelCondition
   * @param condition - Object to validate
   * @returns True if valid LevelCondition
   */
  private isValidCondition(condition: any): condition is LevelCondition {
    return (
      condition &&
      typeof condition === 'object' &&
      typeof condition.type === 'string' &&
      typeof condition.scope === 'string' &&
      typeof condition.value === 'number' &&
      condition.value >= 0 &&
      (condition.level === undefined || (typeof condition.level === 'number' && condition.level > 0))
    );
  }
}
