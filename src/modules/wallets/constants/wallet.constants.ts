/**
 * Wallet module constants
 */
export const WALLET_CONSTANTS = {
  /**
   * Default currency code
   */
  DEFAULT_CURRENCY: 'USDT',

  /**
   * Supported currency codes
   */
  SUPPORTED_CURRENCIES: ['USDT'],

  /**
   * Minimum balance allowed
   */
  MIN_BALANCE: 0,

  /**
   * Maximum balance allowed (safety limit)
   */
  MAX_BALANCE: 9999999999999999.99,
} as const;
