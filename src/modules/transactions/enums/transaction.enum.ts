/**
 * Transaction status enum
 */
export enum TransactionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * Transaction type enum
 */
export enum TransactionType {
  P2P = 'p2p',
  C2C = 'c2c',
  ADD_COMPANY = 'add:company',
  ADD_PERSONAL = 'add:personal',
  INCOME_BONAZA = 'income:bonaza',
  INCOME_PASSIVE = 'income:passive',
  INCOME_BOT = 'income:bot',
  INCOME_TRADING = 'income:trading',
  INCOME_APPRAISAL = 'income:appraisal',
  PURCHASE_PACKAGE = 'purchase:package',
  WITHDRAW_COMPANY = 'withdraw:company',
  WITHDRAW_PERSONAL = 'withdraw:personal',
}
