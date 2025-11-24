import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { TransactionStatus, TransactionType } from '../enums/transaction.enum';
import { Wallet } from '../../wallets/entities/wallet.entity';
import { User } from '../../user/entities/user.entity';
import { decimalTransformer } from 'src/common/transformers/decimal.transformer';

/**
 * Transaction entity representing a transaction in the system.
 * Maps to the 'transactions' table in the database.
 */
@Index('idx_transaction_id_status', ['id', 'status'])
@Index('idx_transaction_status_fromwalletid', ['status', 'fromWalletId'])
@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true, name: 'from_wallet_id' })
  @Index()
  fromWalletId: number | null;

  @ManyToOne(() => Wallet, { nullable: true })
  @JoinColumn({ name: 'from_wallet_id' })
  fromWallet?: Wallet | null;

  @Column({ type: 'int', nullable: true, name: 'to_wallet_id' })
  @Index()
  toWalletId: number | null;

  @ManyToOne(() => Wallet, { nullable: true })
  @JoinColumn({ name: 'to_wallet_id' })
  toWallet?: Wallet | null;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: false,
    transformer: decimalTransformer,
  })
  amount: number;

  @Column({ type: 'int', nullable: false, name: 'initiated_by' })
  @Index()
  initiatedBy: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'initiated_by' })
  initiator?: User;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
    nullable: false,
  })
  status: TransactionStatus;

  @Column({ type: 'timestamp', nullable: true, name: 'status_updated_at' })
  statusUpdatedAt: Date | null;

  @Column({ type: 'int', nullable: true, name: 'status_updated_by' })
  @Index()
  statusUpdatedBy: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'status_updated_by' })
  statusUpdater?: User | null;

  @Column({
    type: 'enum',
    enum: TransactionType,
    nullable: false,
  })
  @Index()
  type: TransactionType;

  @Column({ type: 'int', nullable: true, name: 'entity_id' })
  @Index()
  entityId: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
