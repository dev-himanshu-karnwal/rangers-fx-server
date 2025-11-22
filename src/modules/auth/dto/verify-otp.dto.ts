import { createDTO } from '../../../common/dto';
import { OtpPurpose } from '../../otp/enums/otp.enum';

/**
 * DTO for OTP verification (Step 2)
 * Common DTO for all OTP verification purposes
 */
export const VerifyOtpDto = createDTO('VerifyOtpDto').userId().otp().enum('purpose', OtpPurpose).build();
export type VerifyOtpDto = InstanceType<typeof VerifyOtpDto>;
