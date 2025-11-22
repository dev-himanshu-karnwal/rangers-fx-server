import { IsDefined, IsNotEmpty, IsString, IsInt, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for completing user signup (Step 3)
 * User provides password to complete the signup process
 */
export class CompleteSignupDto {
  @IsDefined()
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}
