import { LevelCondition } from '../../../../modules/levels/interfaces';
import { LevelConditionType, LevelConditionScope } from '../../../../modules/levels/enums';

export type LevelSeedData = {
  title: string;
  appraisalBonus: number;
  passiveIncomePercentage: number;
  conditions: LevelCondition[];
};

/**
 * Default level seed data
 */
export const LEVELS_DATA: LevelSeedData[] = [
  {
    title: 'Executive',
    appraisalBonus: 0,
    passiveIncomePercentage: 5,
    conditions: [],
  },
  {
    title: 'Sales Executive',
    appraisalBonus: 0,
    passiveIncomePercentage: 3,
    conditions: [
      {
        type: LevelConditionType.BUSINESS,
        scope: LevelConditionScope.DIRECT,
        value: 1_500,
      },
    ],
  },
  {
    title: 'Sales Manager',
    appraisalBonus: 0,
    passiveIncomePercentage: 2,
    conditions: [
      {
        type: LevelConditionType.BUSINESS,
        scope: LevelConditionScope.NETWORK,
        value: 10_000,
      },
      {
        type: LevelConditionType.LEVELS,
        scope: LevelConditionScope.NETWORK,
        value: 2,
        level: 2,
      },
    ],
  },
  {
    title: 'Branch Manager',
    appraisalBonus: 200,
    passiveIncomePercentage: 1,
    conditions: [
      {
        type: LevelConditionType.BUSINESS,
        scope: LevelConditionScope.NETWORK,
        value: 30_000,
      },
      {
        type: LevelConditionType.LEVELS,
        scope: LevelConditionScope.NETWORK,
        value: 2,
        level: 3,
      },
    ],
  },
  {
    title: 'Zonal Manager',
    appraisalBonus: 500,
    passiveIncomePercentage: 1,
    conditions: [
      {
        type: LevelConditionType.BUSINESS,
        scope: LevelConditionScope.NETWORK,
        value: 70_000,
      },
      {
        type: LevelConditionType.LEVELS,
        scope: LevelConditionScope.NETWORK,
        value: 2,
        level: 4,
      },
    ],
  },
  {
    title: 'Regional Manager',
    appraisalBonus: 1_000,
    passiveIncomePercentage: 1,
    conditions: [
      {
        type: LevelConditionType.BUSINESS,
        scope: LevelConditionScope.NETWORK,
        value: 170_000,
      },
      {
        type: LevelConditionType.LEVELS,
        scope: LevelConditionScope.NETWORK,
        value: 2,
        level: 5,
      },
    ],
  },
  {
    title: 'Country Head',
    appraisalBonus: 2000,
    passiveIncomePercentage: 1,
    conditions: [
      {
        type: LevelConditionType.BUSINESS,
        scope: LevelConditionScope.NETWORK,
        value: 370_000,
      },
      {
        type: LevelConditionType.LEVELS,
        scope: LevelConditionScope.NETWORK,
        value: 2,
        level: 6,
      },
    ],
  },
  {
    title: 'Global Head',
    appraisalBonus: 3_000,
    passiveIncomePercentage: 1,
    conditions: [
      {
        type: LevelConditionType.BUSINESS,
        scope: LevelConditionScope.NETWORK,
        value: 770_000,
      },
      {
        type: LevelConditionType.LEVELS,
        scope: LevelConditionScope.NETWORK,
        value: 2,
        level: 7,
      },
    ],
  },
  {
    title: 'Global Director',
    appraisalBonus: 4_000,
    passiveIncomePercentage: 1,
    conditions: [
      {
        type: LevelConditionType.BUSINESS,
        scope: LevelConditionScope.NETWORK,
        value: 1_370_000,
      },
      {
        type: LevelConditionType.LEVELS,
        scope: LevelConditionScope.NETWORK,
        value: 2,
        level: 8,
      },
    ],
  },
  {
    title: 'Global President',
    appraisalBonus: 5_000,
    passiveIncomePercentage: 1,
    conditions: [
      {
        type: LevelConditionType.BUSINESS,
        scope: LevelConditionScope.NETWORK,
        value: 2_120_000,
      },
      {
        type: LevelConditionType.LEVELS,
        scope: LevelConditionScope.NETWORK,
        value: 2,
        level: 9,
      },
    ],
  },
  {
    title: 'Global Community',
    appraisalBonus: 8_000,
    passiveIncomePercentage: 1,
    conditions: [
      {
        type: LevelConditionType.LEVELS,
        scope: LevelConditionScope.NETWORK,
        value: 2,
        level: 10,
      },
    ],
  },
  {
    title: 'Global Trust',
    appraisalBonus: 10_000,
    passiveIncomePercentage: 1,
    conditions: [
      {
        type: LevelConditionType.LEVELS,
        scope: LevelConditionScope.NETWORK,
        value: 2,
        level: 11,
      },
    ],
  },
  {
    title: 'Global Management',
    appraisalBonus: 15_000,
    passiveIncomePercentage: 1,
    conditions: [
      {
        type: LevelConditionType.LEVELS,
        scope: LevelConditionScope.NETWORK,
        value: 2,
        level: 12,
      },
    ],
  },
];
