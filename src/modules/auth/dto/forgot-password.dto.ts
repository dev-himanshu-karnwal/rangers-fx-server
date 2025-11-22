import { createDTO } from '../../../common/dto';

/**
 * DTO for forgot password request
 */
export const ForgotPasswordDto = createDTO('ForgotPasswordDto').email().build();
export type ForgotPasswordDto = InstanceType<typeof ForgotPasswordDto>;
