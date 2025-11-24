import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { OtpPurpose } from '../enums/otp.enum';

/**
 * OTP entity representing a one-time password in the system.
 * Maps to the 'otps' table in the database.
 */
@Entity('otps')
@Index('idx_otp_user_email', ['userEmail'])
@Index('idx_otp_email_purpose', ['userEmail', 'purpose'])
export class Otp {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 10 })
  otp: string;

  @Column({ type: 'timestamp', name: 'expires_at' })
  @Index()
  expiresAt: Date;

  @Column({ type: 'varchar', length: 255, name: 'user_email' })
  @Index()
  userEmail: string;

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
