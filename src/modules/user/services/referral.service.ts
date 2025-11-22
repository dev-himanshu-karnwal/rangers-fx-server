import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { USER_CONSTANTS } from '../constants/user.constants';

/**
 * Referral service handling referral code generation and validation
 * Follows Single Responsibility Principle - handles referral-related logic only
 */
@Injectable()
export class ReferralService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Find user by referral code
   * @param referralCode - Referral code
   * @returns User entity or null
   */
  async findUserByReferralCode(referralCode: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { referralCode },
    });
  }

  /**
   * Validate referral code and return referrer user
   * @param referralCode - Referral code to validate
   * @returns Referrer user entity
   * @throws BadRequestException if referral code is invalid
   */
  async validateReferralCode(referralCode: string): Promise<User> {
    const referrer = await this.findUserByReferralCode(referralCode);
    if (!referrer) {
      throw new BadRequestException('Invalid referral code');
    }
    return referrer;
  }

  /**
   * Generate a unique referral code
   * @returns Unique referral code
   */
  async generateUniqueReferralCode(): Promise<string> {
    let referralCode: string;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < USER_CONSTANTS.MAX_REFERRAL_CODE_ATTEMPTS) {
      // Generate referral code with specified length
      referralCode = this.generateRandomCode(USER_CONSTANTS.REFERRAL_CODE_LENGTH);
      const existing = await this.userRepository.findOne({
        where: { referralCode },
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new Error('Failed to generate unique referral code');
    }

    return referralCode!;
  }

  /**
   * Generate random alphanumeric code
   * @param length - Code length
   * @returns Random code
   */
  private generateRandomCode(length: number): string {
    const chars = USER_CONSTANTS.REFERRAL_CODE_CHARS;
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
