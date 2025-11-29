import { IsOptional, IsString, IsEmail, IsEnum, MinLength, MaxLength, Matches, IsInt, Min } from 'class-validator';
import { UserRole, WorkRole, UserStatus } from '../enums/user.enum';

/**
 * DTO for updating user information
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: 'Email format is invalid',
  })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^[0-9+]{7,20}$/, {
    message: 'mobileNumber must contain only digits or + and be 7–20 characters long',
  })
  mobileNumber?: string | null;
}
