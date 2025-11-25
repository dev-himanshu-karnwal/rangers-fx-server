import { IsDefined, IsNotEmpty, IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

/**
 * DTO for completing user login (Step 3)
 * User provides email and password to complete the login process
 */
export class CompleteLoginDto {
  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255) // matches User.email column length
  email: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(255)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Password must contain at least one letter and one number',
  })
  password: string;
}
