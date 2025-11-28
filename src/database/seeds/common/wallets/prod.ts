import { COMPANY_WALLETS_DATA, WalletSeedData } from './data';

/**
 * Returns company wallet data for production environment
 * Can add more wallets or completely replace the default data
 */
export function getCompanyWalletsData(): WalletSeedData[] {
  // Import default data
  const wallets = [...COMPANY_WALLETS_DATA];
  return wallets;
}
