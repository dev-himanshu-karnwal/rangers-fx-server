import { IsDefined, IsNotEmpty, IsInt, IsString, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { OtpPurpose } from '../../otp/enums/otp.enum';

/**
 * DTO for OTP verification (Step 2)
 * Common DTO for all OTP verification purposes
 */
export class VerifyOtpDto {
  @IsDefined()
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  otp: string;

  @IsDefined()
  @IsNotEmpty()
  @IsEnum(OtpPurpose)
  purpose: OtpPurpose;
}
