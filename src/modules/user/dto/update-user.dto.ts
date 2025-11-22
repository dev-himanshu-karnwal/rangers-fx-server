import { IsEmail, IsOptional, IsString, IsEnum, MinLength, Matches } from 'class-validator';
import { UserRole, WorkRole, UserStatus } from '../enums/user.enum';

/**
 * DTO for updating user information
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Mobile number must be a valid international format',
  })
  mobileNumber?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(WorkRole)
  workRole?: WorkRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
