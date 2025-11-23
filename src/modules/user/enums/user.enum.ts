/**
 * User account status enum
 */
export enum UserStatus {
  UNVERIFIED = 'unverified',
  INACTIVE = 'inactive',
  ACTIVE = 'active',
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
  NONE = 'none',
  INVESTOR = 'investor',
  WORKER = 'worker',
}
