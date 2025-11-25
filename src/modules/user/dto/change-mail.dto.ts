import { IsEmail, IsString, Matches, MaxLength } from 'class-validator';

/**
 * DTO for initiating and completing an email change.
 * - `email`: the desired new email address
 */
export class ChangeMailDto {
  @IsString()
  @IsEmail()
  @MaxLength(255)
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: 'Email format is invalid',
  })
  email: string;
}
