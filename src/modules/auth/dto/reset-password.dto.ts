import { createDTO } from '../../../common/dto';

/**
 * DTO for password reset
 */
export const ResetPasswordDto = createDTO('ResetPasswordDto').token().password('newPassword').build();
export type ResetPasswordDto = InstanceType<typeof ResetPasswordDto>;
