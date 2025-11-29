import { WalletSummaryQueryDto } from './wallet-summary-query.dto';

/**
 * Parsed wallet summary query parameters with filters only
 */
export interface ParsedWalletSummaryFilters {
  filters: Record<string, any>;
}

/**
 * Helper class to parse wallet summary query parameters (filters only).
 * No pagination or sorting support.
 */
export class WalletSummaryQueryHelper {
  /**
   * Extracts filter fields from query.
   *
   * @param query - Wallet summary query parameters DTO
   * @returns Object containing only filter fields
   */
  static parse(query: WalletSummaryQueryDto): ParsedWalletSummaryFilters {
    const filters: Record<string, any> = {};

    for (const key in query) {
      if (query.hasOwnProperty(key)) {
        const value = query[key];
        // Only include defined values (not null, not undefined, not empty string)
        if (value !== null && value !== undefined && value !== '') {
          filters[key] = value;
        }
      }
    }

    return { filters };
  }
}
