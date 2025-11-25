import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

/**
 * User Reset Token Service - handles reset password token operations
 * Follows Single Responsibility Principle - handles reset token operations only
 */
@Injectable()
export class UserResetTokenService {
  private readonly logger = new Logger(UserResetTokenService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Update reset password token and expiration
   * @param id - User ID
   * @param token - Reset token (null to clear)
   * @param expiresAt - Expiration date (null to clear)
   */
  async updateResetToken(id: number, token: string | null, expiresAt: Date | null): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.resetPasswordToken = token;
    user.resetPasswordExpiresAt = expiresAt;
    await this.userRepository.save(user);
    this.logger.log(`Reset token updated for user: ${id}`);
  }

  /**
   * Find user by reset password token
   * @param token - Reset password token
   * @returns User entity or null
   */
  async findByResetToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { resetPasswordToken: token } });
  }
}
