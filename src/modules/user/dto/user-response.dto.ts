import { Exclude, Expose, plainToInstance } from 'class-transformer';
import { UserStatus, UserRole, WorkRole } from '../enums/user.enum';
import { User } from '../entities/user.entity';

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
  businessDone: number | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }

  /**
   * Creates a UserResponseDto from a User entity, excluding sensitive fields
   * @param user - User entity to transform
   * @returns UserResponseDto with only exposed fields
   */
  static fromEntity(user: User): UserResponseDto {
    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
  }
}
