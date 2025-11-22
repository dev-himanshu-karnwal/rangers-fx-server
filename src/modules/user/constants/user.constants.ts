/**
 * User module constants
 */

export const USER_CONSTANTS = {
  /**
   * Password hashing salt rounds
   */
  SALT_ROUNDS: 10,

  /**
   * Referral code length
   */
  REFERRAL_CODE_LENGTH: 8,

  /**
   * Maximum attempts to generate unique referral code
   */
  MAX_REFERRAL_CODE_ATTEMPTS: 10,

  /**
   * Referral code character set
   */
  REFERRAL_CODE_CHARS: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
} as const;

