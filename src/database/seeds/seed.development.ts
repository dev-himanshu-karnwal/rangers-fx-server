// Register tsconfig-paths to resolve 'src/' imports
import 'tsconfig-paths/register';

import { config } from 'dotenv';
import { resolve } from 'path';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../modules/user/entities/user.entity';
import { Wallet } from '../../modules/wallets/entities/wallet.entity';
import { WalletType } from '../../modules/wallets/enums/wallet.enum';
import { UserRole, WorkRole, UserStatus } from '../../modules/user/enums/user.enum';
import { PackageType } from '../../modules/packages/enums';
import { Package } from '../../modules/packages/entities/package.entity';
import { Level } from '../../modules/levels/entities/level.entity';
import { LevelConditionScope, LevelConditionType } from '../../modules/levels/enums';
import { LevelCondition } from '../../modules/levels/interfaces';

// Load environment variables from .env.development file
// Works from both TypeScript source and compiled JavaScript
const envPath = resolve(process.cwd(), '.env.development');
config({ path: envPath });
console.log(`Loading environment from: ${envPath}`);

async function seed() {
  // Create DataSource connection
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [User, Wallet, Package, Level],
    synchronize: false,
    logging: false,
  });

  try {
    // Initialize connection
    await dataSource.initialize();
    console.log('Database connection established');

    const userRepository = dataSource.getRepository(User);
    const walletRepository = dataSource.getRepository(Wallet);
    const packageRepository = dataSource.getRepository(Package);
    const levelRepository = dataSource.getRepository(Level);
    // Create user
    const userData = {
      fullName: 'Himanshu Karnwal',
      email: 'himanshukar1810@example.com',
      mobileNumber: '+1234567890',
      passwordHash: await bcrypt.hash('Admin@123', 10),
      status: UserStatus.INACTIVE,
      role: UserRole.ADMIN,
      hasChildren: false,
      referralCode: 'ABC123',
      workRole: WorkRole.NONE,
      businessDone: 0,
    };

    const user = userRepository.create(userData);
    const savedUser = await userRepository.save(user);
    console.log(`User created with ID: ${savedUser.id}`);

    // Create personal wallet
    const personalWallet = walletRepository.create({
      walletType: WalletType.PERSONAL,
      userId: savedUser.id,
    });
    const savedPersonalWallet = await walletRepository.save(personalWallet);
    console.log(`Personal wallet created with ID: ${savedPersonalWallet.id}`);

    // Create first wallet
    const wallet1 = walletRepository.create({
      walletType: WalletType.COMPANY_INCOME,
    });
    const savedWallet1 = await walletRepository.save(wallet1);
    console.log(`Wallet 1 created with ID: ${savedWallet1.id}`);

    // Create second wallet
    const wallet2 = walletRepository.create({
      walletType: WalletType.COMPANY_INVESTMENT,
    });
    const savedWallet2 = await walletRepository.save(wallet2);
    console.log(`Wallet 2 created with ID: ${savedWallet2.id}`);

    // Create packages
    const packagesData = [
      {
        id: 1,
        title: 'Fix 20 Months',
        minPrice: 100,
        maxPrice: 20000,
        months: 20,
        type: PackageType.ONE_TIME,
        features: JSON.stringify(['automatted trading', 'Risk Management', 'Daily Reports', '24X7 Support']),
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
        features: JSON.stringify(['advance ai', 'priority support', 'custom stratefies']),
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
        features: JSON.stringify(['monthly payout', 'flexible terms', 'basic support', 'standard features']),
        returnPercentage: 7,
        returnCapital: 2,
      },
    ];

    for (const data of packagesData) {
      const pkg = packageRepository.create(data);
      const savedPkg = await packageRepository.save(pkg);
      console.log(`Package created with ID: ${savedPkg.id}`);
    }

    // Create levels
    type LevelSeedData = {
      title: string;
      appraisalBonus: number;
      passiveIncomePercentage: number;
      conditions: LevelCondition[];
    };
    const LEVELS_DATA: LevelSeedData[] = [
      {
        title: 'Executive',
        appraisalBonus: 0,
        passiveIncomePercentage: 5,
        conditions: [],
      },
      {
        title: 'Sales Executive',
        appraisalBonus: 0,
        passiveIncomePercentage: 3,
        conditions: [
          {
            type: LevelConditionType.BUSINESS,
            scope: LevelConditionScope.DIRECT,
            value: 1_500,
          },
        ],
      },
      {
        title: 'Sales Manager',
        appraisalBonus: 0,
        passiveIncomePercentage: 2,
        conditions: [
          {
            type: LevelConditionType.BUSINESS,
            scope: LevelConditionScope.NETWORK,
            value: 10_000,
          },
          {
            type: LevelConditionType.LEVELS,
            scope: LevelConditionScope.NETWORK,
            value: 2,
            level: 2,
          },
        ],
      },
      {
        title: 'Branch Manager',
        appraisalBonus: 200,
        passiveIncomePercentage: 1,
        conditions: [
          {
            type: LevelConditionType.BUSINESS,
            scope: LevelConditionScope.NETWORK,
            value: 30_000,
          },
          {
            type: LevelConditionType.LEVELS,
            scope: LevelConditionScope.NETWORK,
            value: 2,
            level: 3,
          },
        ],
      },
      {
        title: 'Zonal Manager',
        appraisalBonus: 500,
        passiveIncomePercentage: 1,
        conditions: [
          {
            type: LevelConditionType.BUSINESS,
            scope: LevelConditionScope.NETWORK,
            value: 70_000,
          },
          {
            type: LevelConditionType.LEVELS,
            scope: LevelConditionScope.NETWORK,
            value: 2,
            level: 4,
          },
        ],
      },
      {
        title: 'Regional Manager',
        appraisalBonus: 1_000,
        passiveIncomePercentage: 1,
        conditions: [
          {
            type: LevelConditionType.BUSINESS,
            scope: LevelConditionScope.NETWORK,
            value: 170_000,
          },
          {
            type: LevelConditionType.LEVELS,
            scope: LevelConditionScope.NETWORK,
            value: 2,
            level: 5,
          },
        ],
      },
      {
        title: 'Country Head',
        appraisalBonus: 2000,
        passiveIncomePercentage: 1,
        conditions: [
          {
            type: LevelConditionType.BUSINESS,
            scope: LevelConditionScope.NETWORK,
            value: 370_000,
          },
          {
            type: LevelConditionType.LEVELS,
            scope: LevelConditionScope.NETWORK,
            value: 2,
            level: 6,
          },
        ],
      },
      {
        title: 'Global Head',
        appraisalBonus: 3_000,
        passiveIncomePercentage: 1,
        conditions: [
          {
            type: LevelConditionType.BUSINESS,
            scope: LevelConditionScope.NETWORK,
            value: 770_000,
          },
          {
            type: LevelConditionType.LEVELS,
            scope: LevelConditionScope.NETWORK,
            value: 2,
            level: 7,
          },
        ],
      },
      {
        title: 'Global Director',
        appraisalBonus: 4_000,
        passiveIncomePercentage: 1,
        conditions: [
          {
            type: LevelConditionType.BUSINESS,
            scope: LevelConditionScope.NETWORK,
            value: 1_370_000,
          },
          {
            type: LevelConditionType.LEVELS,
            scope: LevelConditionScope.NETWORK,
            value: 2,
            level: 8,
          },
        ],
      },
      {
        title: 'Global President',
        appraisalBonus: 5_000,
        passiveIncomePercentage: 1,
        conditions: [
          {
            type: LevelConditionType.BUSINESS,
            scope: LevelConditionScope.NETWORK,
            value: 2_120_000,
          },
          {
            type: LevelConditionType.LEVELS,
            scope: LevelConditionScope.NETWORK,
            value: 2,
            level: 9,
          },
        ],
      },
      {
        title: 'Global Community',
        appraisalBonus: 8_000,
        passiveIncomePercentage: 1,
        conditions: [
          {
            type: LevelConditionType.LEVELS,
            scope: LevelConditionScope.NETWORK,
            value: 2,
            level: 10,
          },
        ],
      },
      {
        title: 'Global Trust',
        appraisalBonus: 10_000,
        passiveIncomePercentage: 1,
        conditions: [
          {
            type: LevelConditionType.LEVELS,
            scope: LevelConditionScope.NETWORK,
            value: 2,
            level: 11,
          },
        ],
      },
      {
        title: 'Global Management',
        appraisalBonus: 15_000,
        passiveIncomePercentage: 1,
        conditions: [
          {
            type: LevelConditionType.LEVELS,
            scope: LevelConditionScope.NETWORK,
            value: 2,
            level: 12,
          },
        ],
      },
    ];

    for (const idx in LEVELS_DATA) {
      const levelData = LEVELS_DATA[idx];
      const hierarchy = Number(idx) + 1;

      const level = levelRepository.create({
        title: levelData.title,
        appraisalBonus: levelData.appraisalBonus,
        passiveIncomePercentage: levelData.passiveIncomePercentage,
        conditions: JSON.stringify(levelData.conditions),
        hierarchy,
      });

      await levelRepository.save(level);
      console.log(`Level ${level.title} created with ID: ${level.id}`);
    }
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
