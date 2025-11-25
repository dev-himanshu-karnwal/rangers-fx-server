import { IsDefined, IsNotEmpty, IsEmail, IsString, IsEnum, MaxLength, MinLength } from 'class-validator';
import { OtpPurpose } from '../../otp/enums/otp.enum';

/**
 * DTO for OTP verification (Step 2)
 * Common DTO for all OTP verification purposes
 */
export class VerifyOtpDto {
  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
  @MinLength(2, { message: 'Email must be at least 2 characters long' })
  @MaxLength(255, { message: 'Email must not exceed 255 characters' })
  userEmail: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  otp: string;

  @IsDefined()
  @IsNotEmpty()
  @IsEnum(OtpPurpose)
  purpose: OtpPurpose;
}
