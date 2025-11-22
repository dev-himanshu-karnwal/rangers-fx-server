import { createDTO } from '../../../common/dto';

/**
 * DTO for completing user signup (Step 3)
 * User provides password to complete the signup process
 */
export const CompleteSignupDto = createDTO('CompleteSignupDto').userId().password().build();
export type CompleteSignupDto = InstanceType<typeof CompleteSignupDto>;
