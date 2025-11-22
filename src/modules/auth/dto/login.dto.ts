import { createDTO } from '../../../common/dto';

/**
 * DTO for user login
 */
export const LoginDto = createDTO('LoginDto').email().password().build();
export type LoginDto = InstanceType<typeof LoginDto>;
