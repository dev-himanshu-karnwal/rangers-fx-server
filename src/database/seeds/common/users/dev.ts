import { USERS_DATA, UserSeedData } from './data';
import { UserRole, WorkRole, UserStatus } from '../../../../modules/user/enums/user.enum';

/**
 * Returns user data for development environment
 * Can add more users or completely replace the default data
 */
export function getUsersData(): UserSeedData[] {
  // Import default data
  const users = [...USERS_DATA];

  // Add development users
  users.push({
    fullName: 'Himanshu Karnwal',
    email: 'himanshukar1810@gmail.com',
    mobileNumber: '+1234567890',
    password: 'Admin@123',
    status: UserStatus.INACTIVE,
    role: UserRole.ADMIN,
    directChildrenCount: 0,
    referralCode: 'ABCD1234',
    workRole: WorkRole.NONE,
    businessDone: 0,
  });

  return users;
}
