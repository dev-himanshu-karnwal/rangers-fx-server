import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { WalletType } from '../enums/wallet.enum';
import { User } from '../../user/entities/user.entity';
import { decimalTransformer } from 'src/common/transformers/decimal.transformer';

/**
 * Wallet entity representing a wallet in the system.
 * Maps to the 'wallets' table in the database.
 */
@Entity('wallets')
@Index('idx_wallet_user_id', ['userId'])
@Index('idx_wallet_type', ['walletType'])
@Check(`"balance" >= 0`) // -- prevent negative wallet balance
@Check(`"currency" ~ '^[A-Z]{3,10}$'`) // -- enforce uppercase currency codes (USDT, USDC, BTC, etc.)
export class Wallet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true, name: 'user_id' })
  @Index()
  userId: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0.0, nullable: false, transformer: decimalTransformer })
  balance: number;

  @Column({
    type: 'enum',
    enum: WalletType,
    default: WalletType.PERSONAL,
    nullable: false,
    name: 'wallet_type',
  })
  walletType: WalletType;

  @Column({ type: 'varchar', length: 10, default: 'USDT', nullable: false })
  currency: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
