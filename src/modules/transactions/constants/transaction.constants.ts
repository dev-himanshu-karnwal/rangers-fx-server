/**
 * Transaction module constants
 */
export const TRANSACTION_CONSTANTS = {
  /**
   * Maximum description length
   */
  MAX_DESCRIPTION_LENGTH: 1000,

  /**
   * Minimum transaction amount (if applicable)
   */
  MIN_AMOUNT: 0.01,

  /**
   * Maximum transaction amount (if applicable)
   */
  MAX_AMOUNT: 9999999999999999.99,
} as const;
