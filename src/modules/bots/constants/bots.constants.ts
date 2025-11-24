export const BOT_CONSTANTS = {
  /**
   * Total amount debited from the activating user's wallet
   */
  ACTIVATION_AMOUNT: 50,
  /**
   * Portion of activation amount credited to the company income wallet
   */
  COMPANY_ALLOCATION_AMOUNT: 35,
  /**
   * Portion of activation amount credited to the referrer's wallet
   */
  REFERRAL_ALLOCATION_AMOUNT: 15,
  /**
   * Bot activation default max income
   */
  DEFAULT_MAX_INCOME: 0,
  /**
   * Bot activation default income received
   */
  DEFAULT_INCOME_RECEIVED: 0,
  /**
   * Bot activation transaction description
   */
  ACTIVATION_TRANSACTION_DESCRIPTION: 'Bot activation fee',
} as const;
