import { UserRole, WorkRole, UserStatus } from '../../../../modules/user/enums/user.enum';

export type UserSeedData = {
  fullName: string;
  email: string;
  mobileNumber: string;
  password: string; // Will be hashed
  status: UserStatus;
  role: UserRole;
  directChildrenCount: number;
  referralCode: string;
  workRole: WorkRole;
  businessDone: number;
};

/**
 * Default user seed data (empty - users are typically environment-specific)
 */
export const USERS_DATA: UserSeedData[] = [];
