import { WalletType } from '../../../../modules/wallets/enums/wallet.enum';

export type WalletSeedData = {
  walletType: WalletType;
  userId?: number; // Optional, only for personal wallets
};

/**
 * Default wallet seed data
 * Company wallets don't need userId
 */
export const COMPANY_WALLETS_DATA: WalletSeedData[] = [
  {
    walletType: WalletType.COMPANY_INCOME,
  },
  {
    walletType: WalletType.COMPANY_INVESTMENT,
  },
];
