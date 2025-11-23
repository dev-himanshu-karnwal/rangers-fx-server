import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { UserStatus, UserRole, WorkRole } from '../enums/user.enum';

/**
 * User entity representing a user in the system.
 * Maps to the 'users' table in the database.
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200 })
  fullName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mobileNumber: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'password_hash' })
  passwordHash: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'password_updated_at' })
  passwordUpdatedAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true, name: 'reset_password_token' })
  resetPasswordToken: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'reset_password_expires_at' })
  resetPasswordExpiresAt: Date | null;

  @Column({ type: 'varchar', length: 64, unique: true, nullable: true, name: 'referral_code' })
  @Index()
  referralCode: string | null;

  @Column({ type: 'int', name: 'referred_by_user_id', nullable: true })
  referredByUserId: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'referred_by_user_id' })
  referredBy?: User | null = null;

  @OneToMany(() => User, (user) => user.referredBy)
  referrals: User[];

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.UNVERIFIED,
  })
  status: UserStatus;

  @Column({ type: 'boolean', default: false, name: 'has_children' })
  hasChildren: boolean;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: WorkRole,
    default: WorkRole.NONE,
    name: 'work_role',
  })
  workRole: WorkRole;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0, name: 'business_done' })
  businessDone: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
