import { config } from 'dotenv';
import { resolve } from 'path';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../src/modules/user/entities/user.entity';
import { Wallet } from '../../src/modules/wallets/entities/wallet.entity';
import { WalletType } from '../../src/modules/wallets/enums/wallet.enum';
import { UserRole, WorkRole, UserStatus } from '../../src/modules/user/enums/user.enum';

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
    entities: [User, Wallet],
    synchronize: false,
    logging: true,
  });

  try {
    // Initialize connection
    await dataSource.initialize();
    console.log('Database connection established');

    const userRepository = dataSource.getRepository(User);
    const walletRepository = dataSource.getRepository(Wallet);

    // Create user
    const userData = {
      fullName: 'Himanshu Karnwal',
      email: 'himanshukar1810@example.com',
      mobileNumber: '+1234567890',
      passwordHash: await bcrypt.hash('Admin@123', 10),
      status: UserStatus.ACTIVE,
      role: UserRole.ADMIN,
      workRole: WorkRole.NONE,
    };

    const user = userRepository.create(userData);
    const savedUser = await userRepository.save(user);
    console.log(`User created with ID: ${savedUser.id}`);

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
