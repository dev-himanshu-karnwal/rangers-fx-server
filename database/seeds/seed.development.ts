// Register tsconfig-paths to resolve 'src/' imports
import 'tsconfig-paths/register';

import { config } from 'dotenv';
import { resolve } from 'path';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../src/modules/user/entities/user.entity';
import { Wallet } from '../../src/modules/wallets/entities/wallet.entity';
import { WalletType } from '../../src/modules/wallets/enums/wallet.enum';
import { UserRole, WorkRole, UserStatus } from '../../src/modules/user/enums/user.enum';
import { PackageType } from '../../src/modules/packages/enums';
import { Package } from '../../src/modules/packages/entities/package.entity';

// Load environment variables from .env.development file
// Works from both TypeScript source and compiled JavaScript
const envPath = resolve(process.cwd(), '.env.development');
config({ path: envPath });
console.log(`Loading environment from: ${envPath}`);

async function seed() {
  // Create DataSource connection
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'rangers_fx',
    entities: [User, Wallet, Package],
    synchronize: false,
    logging: true,
  });

  try {
    // Initialize connection
    await dataSource.initialize();
    console.log('Database connection established');

    const userRepository = dataSource.getRepository(User);
    const walletRepository = dataSource.getRepository(Wallet);
    const packageRepository = dataSource.getRepository(Package);

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
