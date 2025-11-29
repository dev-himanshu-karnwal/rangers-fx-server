import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../../modules/user/entities/user.entity';
import { Wallet } from '../../../modules/wallets/entities/wallet.entity';
import { Package } from '../../../modules/packages/entities/package.entity';
import { Level } from '../../../modules/levels/entities/level.entity';
import { WalletType } from '../../../modules/wallets/enums/wallet.enum';
import { PackageSeedData } from './packages/data';
import { LevelSeedData } from './levels/data';
import { WalletSeedData } from './wallets/data';
import { UserSeedData } from './users/data';
import fs from 'fs';
import path from 'path';

/**
 * Creates and initializes a DataSource connection for seeding
 */
export async function createDataSource(): Promise<DataSource> {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [User, Wallet, Package, Level],
    synchronize: false,
    logging: false,
    ssl:
      process.env.NODE_ENV === 'production'
        ? {
            ca: fs.readFileSync(path.join(process.cwd(), 'certs/cert.crt'), 'utf-8').toString(),
          }
        : false,
  });

  await dataSource.initialize();
  console.log('Database connection established');
  return dataSource;
}

/**
 * Seeds packages into the database
 */
export async function seedPackages(dataSource: DataSource, packagesData: PackageSeedData[]): Promise<void> {
  const packageRepository = dataSource.getRepository(Package);

  for (const data of packagesData) {
    const pkg = packageRepository.create({
      ...data,
      features: JSON.stringify(data.features),
    });
    const savedPkg = await packageRepository.save(pkg);
    console.log(`Package created with ID: ${savedPkg.id}`);
  }
}

/**
 * Seeds levels into the database
 */
export async function seedLevels(dataSource: DataSource, levelsData: LevelSeedData[]): Promise<void> {
  const levelRepository = dataSource.getRepository(Level);

  for (const idx in levelsData) {
    const levelData = levelsData[idx];
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
}

/**
 * Seeds company wallets (income and investment wallets)
 */
export async function seedCompanyWallets(dataSource: DataSource, walletsData: WalletSeedData[]): Promise<void> {
  const walletRepository = dataSource.getRepository(Wallet);

  for (const walletData of walletsData) {
    const wallet = walletRepository.create({
      walletType: walletData.walletType,
      userId: walletData.userId,
    });
    const savedWallet = await walletRepository.save(wallet);
    console.log(`Company wallet (${walletData.walletType}) created with ID: ${savedWallet.id}`);
  }
}

/**
 * Seeds users into the database
 */
export async function seedUsers(dataSource: DataSource, usersData: UserSeedData[]): Promise<number[]> {
  const userRepository = dataSource.getRepository(User);
  const userIds: number[] = [];

  for (const userData of usersData) {
    const { password, ...userDataWithoutPassword } = userData;
    const user = userRepository.create({
      ...userDataWithoutPassword,
      passwordHash: await bcrypt.hash(password, 10),
    });
    const savedUser = await userRepository.save(user);
    userIds.push(savedUser.id);
    console.log(`User created with ID: ${savedUser.id}`);
  }

  return userIds;
}

/**
 * Seeds a personal wallet for a user
 */
export async function seedPersonalWallet(dataSource: DataSource, userId: number): Promise<void> {
  const walletRepository = dataSource.getRepository(Wallet);

  const personalWallet = walletRepository.create({
    walletType: WalletType.PERSONAL,
    userId: userId,
  });
  const savedPersonalWallet = await walletRepository.save(personalWallet);
  console.log(`Personal wallet created with ID: ${savedPersonalWallet.id}`);
}
