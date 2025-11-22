import { createDTO } from '../../../common/dto';

/**
 * DTO for initiating user signup (Step 1)
 * User provides email, name, and optional referral code
 */
export const SignupInitiateDto = createDTO('SignupInitiateDto')
  .string('fullName', true, { minLength: 2 })
  .email()
  .string('referralCode', true)
  .build();
export type SignupInitiateDto = InstanceType<typeof SignupInitiateDto>;
