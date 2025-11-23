import { IsDefined, IsNotEmpty, IsEmail, IsString, IsEnum } from 'class-validator';
import { OtpPurpose } from '../../otp/enums/otp.enum';

/**
 * DTO for OTP verification (Step 2)
 * Common DTO for all OTP verification purposes
 */
export class VerifyOtpDto {
  @IsDefined()
  @IsNotEmpty()
  @IsEmail()
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
