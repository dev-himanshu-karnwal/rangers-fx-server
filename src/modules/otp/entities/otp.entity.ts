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
import { OtpPurpose } from '../enums/otp.enum';
import { User } from '../../user/entities/user.entity';

/**
 * OTP entity representing a one-time password in the system.
 * Maps to the 'otps' table in the database.
 */
@Entity('otps')
export class Otp {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 10 })
  otp: string;

  @Column({ type: 'timestamp', name: 'expires_at' })
  @Index()
  expiresAt: Date;

  @Column({ type: 'int', name: 'user_id' })
  @Index()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: OtpPurpose,
  })
  @Index()
  purpose: OtpPurpose;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
