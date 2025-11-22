/**
 * User account status enum
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

/**
 * User role enum for system access control
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

/**
 * Work role enum for business classification
 */
export enum WorkRole {
  INVESTOR = 'investor',
  WORKER = 'worker',
}
