import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * DTO for initiating and completing an email change.
 * - `email`: the desired new email address
 */
export class ChangeMailDto {
  @IsString()
  @IsEmail()
  email: string;
}
