import { IsString, MinLength } from 'class-validator';

/**
 * DTO for changing a user's password
 * - `oldPassword`: current password of the user
 * - `newPassword`: desired new password (must be at least 8 characters)
 */
export class ChangePasswordDto {
  @IsString()
  oldPassword: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}
