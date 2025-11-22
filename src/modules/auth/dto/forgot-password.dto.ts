import { IsEmail, IsNotEmpty } from 'class-validator';

/**
 * DTO for forgot password request
 */
export class ForgotPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
