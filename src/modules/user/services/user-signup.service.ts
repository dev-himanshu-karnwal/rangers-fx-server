import { Injectable, ConflictException, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserStatus } from '../enums/user.enum';
import { UserReferralService } from './user-referral.service';
import { UserClosureService } from '../closure/closure.service';
import { WalletService } from '../../wallets/wallet.service';
import { UserQueryService } from './user-query.service';
import { UserPasswordService } from './user-password.service';

/**
 * User Signup Service - handles user creation and signup completion
 * Follows Single Responsibility Principle - handles signup operations only
 */
@Injectable()
export class UserSignupService {
  private readonly logger = new Logger(UserSignupService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly UserReferralService: UserReferralService,
    private readonly userClosureService: UserClosureService,
    private readonly walletService: WalletService,
    private readonly userQueryService: UserQueryService,
    private readonly userPasswordService: UserPasswordService,
  ) {}

  /**
   * Create an unverified user (for signup initiation)
   * @param email - User email
   * @param fullName - User full name
   * @param referredByUserId - Referrer user ID
   * @returns Created user entity
   */
  async createUnverifiedUser(email: string, fullName: string, referredByUserId: number): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userQueryService.findByEmail(email);
    if (existingUser) {
      // If user is not unverified, throw error
      if (existingUser.status !== UserStatus.UNVERIFIED) {
        throw new ConflictException('Email already exists');
      }

      // If user is unverified, delete the old entry
      this.logger.log(`Deleting unverified user with email: ${existingUser.email}`);
      await this.userRepository.delete(existingUser.id);
      this.logger.log(`Deleted unverified user: ${existingUser.id}`);
    }

    // Validate referrer
    const referrer = await this.userQueryService.findByIdEntity(referredByUserId);
    if (!referrer) {
      throw new NotFoundException('Referrer not found');
    }

    // Create user entity without password
    const user = this.userRepository.create({
      fullName,
      email,
      referredByUserId,
      status: UserStatus.UNVERIFIED,
    });

    return this.userRepository.save(user);
  }

  /**
   * Complete user signup - set password, generate referral code, create wallet and closure entries
   * @param userEmail - User email
   * @param password - User password
   * @returns Updated user entity
   */
  async completeUserSignup(userEmail: string, password: string): Promise<User> {
    // Find user
    const user = await this.userQueryService.findByEmail(userEmail, { relations: ['referredBy'] });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already has a password (already completed signup)
    if (user.passwordHash) {
      throw new BadRequestException('User signup already completed');
    }

    // Preserve referredByUserId before any modifications
    const referredByUserId = user.referredByUserId;

    // Generate unique referral code
    const referralCode = await this.UserReferralService.generateUniqueReferralCode();

    // Hash password
    const passwordHash = await this.userPasswordService.hashPassword(password);

    // Update user with password, referral code, and verification status
    user.passwordHash = passwordHash;
    user.passwordUpdatedAt = new Date();
    user.referralCode = referralCode;
    user.referredByUserId = referredByUserId;

    const updatedUser = await this.userRepository.save(user);

    // Create wallet for the user
    await this.walletService.createWallet(updatedUser.id);

    // Create closure table entries for the new user
    // This creates the self-row (depth=0) and all ancestor rows if parent exists
    try {
      await this.userClosureService.createClosuresForUser(updatedUser.id, updatedUser.referredByUserId);
      this.logger.log(`Closure entries created for user: ${updatedUser.email}`);
    } catch (error) {
      // Log error but don't fail signup - closure entries are important but shouldn't block user registration
      this.logger.error(
        `Failed to create closure entries for user ${updatedUser.email}: ${error.message}`,
        error.stack,
      );
      // Re-throw if it's a critical error that should block signup
      if (error instanceof ConflictException) {
        throw error;
      }
    }

    return updatedUser;
  }
}
