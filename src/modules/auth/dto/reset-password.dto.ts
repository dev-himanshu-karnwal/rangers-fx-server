import { IsDefined, IsNotEmpty, IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

/**
 * DTO for password reset
 */
export class ResetPasswordDto {
  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  userEmail: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(255)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Password must contain at least one letter and one number',
  })
  newPassword: string;
}
