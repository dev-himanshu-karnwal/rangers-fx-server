import { USERS_DATA, UserSeedData } from './data';

/**
 * Returns user data for production environment
 * Can add more users or completely replace the default data
 */
export function getUsersData(): UserSeedData[] {
  // Import default data
  const users = [...USERS_DATA];
  return users;
}
