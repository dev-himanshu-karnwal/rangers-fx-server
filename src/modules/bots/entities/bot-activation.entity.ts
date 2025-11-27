import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { BotActivationStatus } from '../enums';
import { decimalTransformer } from '../../../common/transformers/decimal.transformer';
import { Wallet } from '../../wallets/entities/wallet.entity';
import { BOT_CONSTANTS } from '../constants/bots.constants';

@Entity('bot_activations')
@Index('idx_bot_activations_user_id', ['userId'])
@Index('idx_bot_activations_wallet_id', ['walletId'])
@Index('idx_bot_activations_status', ['status'])
export class BotActivation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false, name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int', nullable: false, name: 'wallet_id' })
  walletId: number;

  @ManyToOne(() => Wallet, { nullable: false })
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;

  @Column({
    type: 'enum',
    enum: BotActivationStatus,
    default: BotActivationStatus.ACTIVE,
    nullable: false,
  })
  status: BotActivationStatus;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: false,
    default: BOT_CONSTANTS.DEFAULT_INCOME_RECEIVED,
    name: 'income_received',
    transformer: decimalTransformer,
  })
  incomeReceived: number;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: false,
    default: BOT_CONSTANTS.DEFAULT_MAX_INCOME,
    name: 'max_income',
    transformer: decimalTransformer,
  })
  maxIncome: number;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
