import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for user login
 */
export class LoginDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
