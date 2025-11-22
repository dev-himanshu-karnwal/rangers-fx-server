import { IsDefined, IsNotEmpty, IsString, IsInt, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for password reset
 */
export class ResetPasswordDto {
  @IsDefined()
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  newPassword: string;
}
