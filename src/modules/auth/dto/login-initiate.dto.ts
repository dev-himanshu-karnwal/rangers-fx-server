import { IsDefined, IsNotEmpty, IsEmail, MaxLength } from 'class-validator';

/**
 * DTO for initiating user login (Step 1)
 * User provides email to receive OTP
 */
export class LoginInitiateDto {
  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email: string;
}
