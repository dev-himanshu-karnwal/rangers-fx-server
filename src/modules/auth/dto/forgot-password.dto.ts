import { IsDefined, IsNotEmpty, IsEmail, MaxLength } from 'class-validator';

/**
 * DTO for forgot password request
 */
export class ForgotPasswordDto {
  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email: string;
}
