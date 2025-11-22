import { IsDefined, IsNotEmpty, IsEmail, IsString, MinLength } from 'class-validator';

/**
 * DTO for completing user login (Step 3)
 * User provides email and password to complete the login process
 */
export class CompleteLoginDto {
  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}
