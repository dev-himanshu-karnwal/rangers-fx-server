import { IsDefined, IsNotEmpty, IsEmail, IsString, MinLength, IsNumber, MaxLength, IsInt } from 'class-validator';

/**
 * DTO for initiating user signup (Step 1)
 * User provides email, name, and optional referral code
 */
export class SignupInitiateDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MinLength(2, { message: 'Full name must be at least 2 characters long' })
  @MaxLength(200, { message: 'Full name must not exceed 200 characters' })
  fullName: string;

  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255, { message: 'Email must not exceed 255 characters' })
  email: string;

  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  @IsInt({ message: 'referredByUserId must be an integer' })
  referredByUserId: number;
}
