import { IsDefined, IsNotEmpty, IsEmail } from 'class-validator';

/**
 * DTO for forgot password request
 */
export class ForgotPasswordDto {
  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
