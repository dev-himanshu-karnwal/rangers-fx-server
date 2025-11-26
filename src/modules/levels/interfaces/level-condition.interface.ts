import { LevelConditionScope, LevelConditionType } from '../enums';

export interface LevelCondition {
  type: LevelConditionType;
  scope: LevelConditionScope;
  value: number;
  level?: number;
}
