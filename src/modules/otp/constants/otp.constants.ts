/**
 * OTP module constants
 */

export const OTP_CONSTANTS = {
  /**
   * OTP length (number of digits)
   */
  OTP_LENGTH: 6,

  /**
   * OTP expiry time in minutes
   */
  OTP_EXPIRY_MINUTES: 10,

  /**
   * Maximum number of OTP attempts allowed
   */
  MAX_OTP_ATTEMPTS: 5,

  /**
   * OTP character set (numeric)
   */
  OTP_CHARS: '0123456789',
} as const;
