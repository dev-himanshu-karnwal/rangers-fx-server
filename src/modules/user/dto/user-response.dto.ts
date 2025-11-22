import { Exclude, Expose } from 'class-transformer';
import { UserStatus, UserRole, WorkRole } from '../enums/user.enum';

/**
 * DTO for user response (excludes sensitive information)
 */
@Exclude()
export class UserResponseDto {
  @Expose()
  id: number;

  @Expose()
  fullName: string;

  @Expose()
  email: string;

  @Expose()
  mobileNumber: string | null;

  @Expose()
  referralCode: string | null;

  @Expose()
  referredByUserId: number | null;

  @Expose()
  status: UserStatus;

  @Expose()
  isVerified: boolean;

  @Expose()
  role: UserRole;

  @Expose()
  workRole: WorkRole;

  @Expose()
  businessDone: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
