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
import { Package } from './package.entity';
import { decimalTransformer } from '../../../common/transformers/decimal.transformer';
import { BotActivation } from '../../bots/entities/bot-activation.entity';
import { UserPackageStatus } from '../enums/user-package-status.enum';

@Entity('user_packages')
@Index('idx_user_packages_user_id', ['userId'])
@Index('idx_user_packages_bot_id', ['botId'])
export class UserPackage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false, name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int', nullable: false, name: 'package_id' })
  packageId: number;

  @ManyToOne(() => Package, { nullable: false })
  @JoinColumn({ name: 'package_id' })
  package: Package;

  @Column({ type: 'int', nullable: false, name: 'bot_id' })
  botId: number;

  @ManyToOne(() => BotActivation, { nullable: false })
  @JoinColumn({ name: 'bot_id' })
  bot: BotActivation;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: false,
    name: 'investment_amount',
    transformer: decimalTransformer,
  })
  investmentAmount: number;

  @Column({
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
    name: 'purchase_date',
  })
  purchaseDate: Date;

  @Column({
    type: 'enum',
    enum: UserPackageStatus,
    nullable: false,
    default: UserPackageStatus.INPROGRESS,
  })
  status: UserPackageStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
