import { IsEmail, IsNotEmpty, IsString, IsOptional, IsEnum, MinLength, Matches } from 'class-validator';
import { UserRole, WorkRole } from '../enums/user.enum';

/**
 * DTO for creating a new user
 */
export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  fullName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Mobile number must be a valid international format',
  })
  mobileNumber: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsOptional()
  @IsString()
  referralCode?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(WorkRole)
  workRole?: WorkRole;
}
