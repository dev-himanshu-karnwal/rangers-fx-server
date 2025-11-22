import { createDTO } from '../../../common/dto';
import { UserRole, WorkRole, UserStatus } from '../enums/user.enum';

/**
 * DTO for updating user information
 */
export const UpdateUserDto = createDTO('UpdateUserDto')
  .string('fullName', false, { minLength: 2 })
  .email('email', false)
  .string('mobileNumber', false)
  .enum('role', UserRole, false)
  .enum('workRole', WorkRole, false)
  .enum('status', UserStatus, false)
  .build();
export type UpdateUserDto = InstanceType<typeof UpdateUserDto>;
