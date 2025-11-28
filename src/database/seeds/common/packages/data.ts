import { PackageType } from '../../../../modules/packages/enums';

export type PackageSeedData = {
  id?: number;
  title: string;
  minPrice: number;
  maxPrice: number;
  months: number;
  type: PackageType;
  features: string[]; // Will be JSON stringified
  returnPercentage: number | null;
  returnCapital: number;
};

/**
 * Default package seed data
 */
export const PACKAGES_DATA: PackageSeedData[] = [
  {
    id: 1,
    title: 'Fix 20 Months',
    minPrice: 100,
    maxPrice: 20000,
    months: 20,
    type: PackageType.ONE_TIME,
    features: ['automatted trading', 'Risk Management', 'Daily Reports', '24X7 Support'],
    returnPercentage: null,
    returnCapital: 2,
  },
  {
    id: 2,
    title: 'Fix 26 Months',
    minPrice: 100,
    maxPrice: 20000,
    months: 26,
    type: PackageType.ONE_TIME,
    features: ['advance ai', 'priority support', 'custom stratefies'],
    returnPercentage: null,
    returnCapital: 2.5,
  },
  {
    id: 3,
    title: 'Monthly Return Package',
    minPrice: 100,
    maxPrice: 20000,
    months: 29,
    type: PackageType.MONTHLY,
    features: ['monthly payout', 'flexible terms', 'basic support', 'standard features'],
    returnPercentage: 7,
    returnCapital: 2,
  },
];
