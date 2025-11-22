import { IsDefined, IsNotEmpty, IsEmail, IsString, MinLength } from 'class-validator';

/**
 * DTO for initiating user signup (Step 1)
 * User provides email, name, and optional referral code
 */
export class SignupInitiateDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  fullName: string;

  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  referralCode: string;
}
