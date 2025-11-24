import { IsEmail, IsString } from 'class-validator';

/**
 * DTO for verifying a user's email
 * - `email`: email to verify
 */
export class EmailVerifyDTO {
  @IsString()
  @IsEmail()
  email: string;
}
