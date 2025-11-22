import { createDTO } from '../../../common/dto';

/**
 * DTO for initiating user login (Step 1)
 * User provides email to receive OTP
 */
export const LoginInitiateDto = createDTO('LoginInitiateDto').email().build();
export type LoginInitiateDto = InstanceType<typeof LoginInitiateDto>;
