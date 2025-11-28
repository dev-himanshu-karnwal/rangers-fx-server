// Register tsconfig-paths to resolve 'src/' imports
import 'tsconfig-paths/register';

import { config } from 'dotenv';
import { resolve } from 'path';
import { createDataSource, seedPackages, seedLevels, seedCompanyWallets } from './common/seed-helpers';
import { getPackagesData } from './common/packages/prod';
import { getLevelsData } from './common/levels/prod';
import { getCompanyWalletsData } from './common/wallets/prod';

// Load environment variables from .env.production file
// Works from both TypeScript source and compiled JavaScript
const envPath = resolve(process.cwd(), '.env.production');
config({ path: envPath });
console.log(`Loading environment from: ${envPath}`);

async function seed() {
  const dataSource = await createDataSource();

  try {
    // Get data from prod files
    const packagesData = getPackagesData();
    const levelsData = getLevelsData();
    const companyWalletsData = getCompanyWalletsData();

    // Seed company wallets (required for system operation)
    await seedCompanyWallets(dataSource, companyWalletsData);

    // Seed packages (required for system operation)
    await seedPackages(dataSource, packagesData);

    // Seed levels (required for system operation)
    await seedLevels(dataSource, levelsData);

    console.log('Production seed completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    // Close connection
    await dataSource.destroy();
    console.log('Database connection closed');
  }
}

// Run the seed
seed()
  .then(() => {
    console.log('Seed script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed script failed:', error);
    process.exit(1);
  });
