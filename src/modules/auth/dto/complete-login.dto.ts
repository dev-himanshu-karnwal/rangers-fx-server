import { createDTO } from '../../../common/dto';

/**
 * DTO for completing user login (Step 3)
 * User provides email and password to complete the login process
 */
export const CompleteLoginDto = createDTO('CompleteLoginDto').email().password().build();
export type CompleteLoginDto = InstanceType<typeof CompleteLoginDto>;
