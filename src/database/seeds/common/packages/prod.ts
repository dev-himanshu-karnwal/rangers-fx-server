import { PACKAGES_DATA, PackageSeedData } from './data';

/**
 * Returns package data for production environment
 * Can add more packages or completely replace the default data
 */
export function getPackagesData(): PackageSeedData[] {
  // Import default data
  const packages = [...PACKAGES_DATA];
  return packages;
}
