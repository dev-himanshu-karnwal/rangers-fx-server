import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { ChangePasswordDto } from '../dto';
import { USER_CONSTANTS } from '../constants/user.constants';
import { ApiResponse } from '../../../common/response/api.response';

/**
 * User Password Service - handles all password-related operations
 * Follows Single Responsibility Principle - handles password operations only
 */
@Injectable()
export class UserPasswordService {
  private readonly logger = new Logger(UserPasswordService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Update user password
   * @param id - User ID
   * @param newPassword - New password
   */
  async updatePassword(id: number, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.passwordHash = await bcrypt.hash(newPassword, USER_CONSTANTS.SALT_ROUNDS);
    user.passwordUpdatedAt = new Date();

    await this.userRepository.save(user);
    this.logger.log(`Password updated for user: ${id}`);
  }

  /**
   * Change password for the current authenticated user.
   * - Verifies the provided `oldPassword` matches the stored password hash
   * - Ensures the `newPassword` is different from the old password
   * - Hashes and stores the new password and updates the `passwordUpdatedAt`
   * @param changePasswordDto - Contains `oldPassword` and `newPassword`
   * @param user - Current authenticated user (from controller)
   * @returns ApiResponse<null> on success
   */
  async changePassword(changePasswordDto: ChangePasswordDto, user: User): Promise<ApiResponse<null>> {
    const userEntity = await this.userRepository.findOne({ where: { id: user.id } });
    if (!userEntity || !userEntity.passwordHash) {
      throw new NotFoundException('User Not found or password not set.');
    }

    const isMatch = await bcrypt.compare(changePasswordDto.oldPassword, userEntity.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Old password does not match.');
    }

    if (changePasswordDto.oldPassword === changePasswordDto.newPassword) {
      throw new BadRequestException('New password must be different from old password.');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(changePasswordDto.newPassword, USER_CONSTANTS.SALT_ROUNDS);

    // Update password and passwordUpdatedAt
    userEntity.passwordHash = newPasswordHash;
    userEntity.passwordUpdatedAt = new Date();

    await this.userRepository.save(userEntity);

    return ApiResponse.success('Password changed successfully.', null);
  }

  /**
   * Hash a password
   * @param password - Plain text password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, USER_CONSTANTS.SALT_ROUNDS);
  }
}
