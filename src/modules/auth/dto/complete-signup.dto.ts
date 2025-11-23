import { IsDefined, IsNotEmpty, IsEmail, IsString, MinLength } from 'class-validator';

/**
 * DTO for completing user signup (Step 3)
 * User provides email and password to complete the signup process
 */
export class CompleteSignupDto {
  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  userEmail: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}
