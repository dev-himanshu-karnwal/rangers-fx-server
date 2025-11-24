import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * DTO for initiating and completing an email change.
 * - `oldEmail`: the user's existing email address (used to identify the account)
 * - `newEmail`: the desired new email address
 * Both fields are optional because the same DTO is reused for both OTP sending and completion flows.
 */
export class ChangeMailDto {
  @IsEmail()
  @IsOptional()
  oldEmail?: string;

  @IsEmail()
  @IsOptional()
  newEmail?: string;
}
