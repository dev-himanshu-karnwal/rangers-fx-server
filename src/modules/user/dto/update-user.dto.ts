import { IsOptional, IsString, IsEmail, IsEnum, MinLength, IsBoolean } from 'class-validator';
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
  mobileNumber?: string | null;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(WorkRole)
  workRole?: WorkRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsBoolean()
  hasChildren?: boolean | null;
}
