import { LEVELS_DATA, LevelSeedData } from './data';

/**
 * Returns level data for production environment
 * Can add more levels or completely replace the default data
 */
export function getLevelsData(): LevelSeedData[] {
  // Import default data
  const levels = [...LEVELS_DATA];

  // You can add more levels for production here
  // levels.push({ ... });

  // Or completely replace the data
  // return [{ ... }];

  return levels;
}
