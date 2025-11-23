import { IsDefined, IsNotEmpty, IsEmail, IsString, MinLength } from 'class-validator';

/**
 * DTO for password reset
 */
export class ResetPasswordDto {
  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  userEmail: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  newPassword: string;
}
