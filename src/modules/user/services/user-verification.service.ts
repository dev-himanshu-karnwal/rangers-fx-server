import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserStatus } from '../enums/user.enum';

/**
 * User Verification Service - handles user verification operations
 * Follows Single Responsibility Principle - handles verification operations only
 */
@Injectable()
export class UserVerificationService {
  private readonly logger = new Logger(UserVerificationService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Mark user as verified (change status to inactive)
   * @param email - User email
   */
  async verifyUser(email: string): Promise<void> {
    await this.userRepository.update({ email }, { status: UserStatus.INACTIVE });
    this.logger.log(`User verified: ${email}`);
  }
}
