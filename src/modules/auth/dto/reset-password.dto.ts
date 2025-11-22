import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * DTO for password reset
 */
export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  newPassword: string;
}
