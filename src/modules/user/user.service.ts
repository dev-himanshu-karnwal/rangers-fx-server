import { Injectable, ConflictException, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, FindOneOptions, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { ChangeMailDto, ChangePasswordDto, EmailVerifyDTO, UpdateUserDto, UserResponseDto } from './dto';
import { USER_CONSTANTS } from './constants/user.constants';
import { ApiResponse } from '../../common/response/api.response';
import { ReferralService } from './services/referral.service';
import { UserClosureService } from './closure/closure.service';
import { WalletService } from '../wallets/wallet.service';
import { UserStatus } from './enums/user.enum';
import { OtpService } from '../otp/otp.service';
import { OtpPurpose } from '../otp/enums';
import { EmailService } from 'src/core/services/email/email.service';
import { ConfigService } from 'src/config/config.service';

/**
 * User service handling business logic for user operations
 * Follows Single Responsibility Principle - handles user-related business logic only
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly referralService: ReferralService,
    private readonly userClosureService: UserClosureService,
    private readonly walletService: WalletService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
  ) {}

  /**
   * Find user by ID
   * @param id - User ID
   * @returns User response DTO
   */
  async findOne(id: number): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return UserResponseDto.fromEntity(user);
  }

  /**
   * Find user by referral code
   * @param referralCode - Referral code
   * @returns User response DTO
   */
  async findOneByReferralCode(referralCode: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { referralCode } });
    if (!user) {
      throw new NotFoundException(`User with referral code ${referralCode} not found`);
    }
    return UserResponseDto.fromEntity(user);
  }

  /**
   * Find user by email (internal use)
   * @param email - User email
   * @returns User entity or null
   */
  async findByEmail(email: string, options?: FindOneOptions<User>): Promise<User | null> {
    return this.userRepository.findOne({ where: { email }, ...options });
  }

  /**
   * Find user by email with password hash (for authentication)
   * @param email - User email
   * @returns User entity with password hash or null
   */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /**
   * Find user by ID (returns entity for internal use)
   * @param id - User ID
   * @returns User entity or null
   */
  async findByIdEntity(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  /**
   * Find User by referredByUserId
   * @param id - referredByUserId
   * @returns User Entity or null
   */
  async findUserByReferredByUserId(referredByUserId: number): Promise<User | null> {
    if (!referredByUserId) {
      return null;
    }
    const user = await this.userRepository.findOne({
      where: { id: Equal(referredByUserId) },
    });
    return user;
  }

  /**
   * Find user by reset password token
   * @param token - Reset password token
   * @returns User entity or null
   */
  async findByResetToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { resetPasswordToken: token } });
  }

  /**
   * Find all direct children (referrals) of a user by their user ID.
   * This returns all users whose `referredByUserId` matches the given ID,
   * meaning they were referred directly by that user.
   * @param id - The ID of the parent/referrer user.
   * @returns A list of User entities or null if no referrals exist.
   */
  async findDirectChildrenOfUserById(id: number): Promise<ApiResponse<{ users: UserResponseDto[] }>> {
    const directChildren = await this.userRepository.find({ where: { referredByUserId: id } });
    if (directChildren.length === 0) {
      throw new NotFoundException(`Direct Children not found for ${id} User Id`);
    }
    return ApiResponse.success('Direct Children fetched Successfully.', {
      users: directChildren.map((user) => UserResponseDto.fromEntity(user)),
    });
  }

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
   * Update user information
   * @param id - User ID
   * @param updateUserDto - Update data
   * @returns Updated user response DTO
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check email uniqueness
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser && existingUser.id !== user.id) {
        throw new ConflictException('Email already exists');
      }
    }

    // Update user fields
    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);

    this.logger.log(`User updated: ${id}`);
    return UserResponseDto.fromEntity(updatedUser);
  }

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
   * Get current user profile
   * @param user - User entity
   * @returns User profile response
   */
  getMe(user: User): ApiResponse<{ user: UserResponseDto }> {
    return ApiResponse.success('User profile fetched successfully', { user: UserResponseDto.fromEntity(user) });
  }

  /**
   * Mark user as verified (change status to inactive)
   * @param email - User email
   */
  async verifyUser(email: string): Promise<void> {
    await this.userRepository.update({ email }, { status: UserStatus.INACTIVE });
    this.logger.log(`User verified: ${email}`);
  }

  /**
   * Create an unverified user (for signup initiation)
   * @param email - User email
   * @param fullName - User full name
   * @param referredByUserId - Referrer user ID
   * @returns Created user entity
   */
  async createUnverifiedUser(email: string, fullName: string, referredByUserId: number): Promise<User> {
    // Check if email already exists
    const existingUser = await this.findByEmail(email);
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
    const referrer = await this.findByIdEntity(referredByUserId);
    if (!referrer) {
      throw new NotFoundException('Referrer not found');
    }

    // Create user entity without password
    const user = this.userRepository.create({
      fullName,
      email,
      referredByUserId,
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
    const user = await this.findByEmail(userEmail, { relations: ['referredBy'] });
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
    const referralCode = await this.referralService.generateUniqueReferralCode();

    // Hash password
    const passwordHash = await bcrypt.hash(password, USER_CONSTANTS.SALT_ROUNDS);

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
    const currentUser = this.getMe(user);
    if (!currentUser.data) {
      throw new NotFoundException('Login First to change password.');
    }
    const userEntity = await this.userRepository.findOne({ where: { id: currentUser.data.user.id } });
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
   * Initiate change email process by sending an OTP to the user's current (old) email.
   * @param updateUserEmail - DTO containing `oldEmail` (and optionally `newEmail`)
   * @returns ApiResponse with success message if OTP was generated/sent
   */
  async verifyEmail(emailVerifyDTO: EmailVerifyDTO): Promise<ApiResponse<null>> {
    // Generate and send OTP
    const otpCode = await this.otpService.generateOtp(emailVerifyDTO.email, OtpPurpose.VERIFY);
    if (this.configService.isProduction) {
      await this.emailService.sendVerificationEmail(emailVerifyDTO.email, 'user', otpCode);
    }

    this.logger.log(`Login OTP sent to user: ${emailVerifyDTO.email}`);

    return ApiResponse.success('OTP Sent Successfully.', null);
  }

  /**
   * Complete change email process by updating the user's email after verification.
   * - Finds the user by `oldEmail`, updates to `newEmail` and returns updated user DTO
   * @param changeMailDto - DTO containing `oldEmail` and `newEmail`
   * @param currentUser - Current authenticated user
   * @returns ApiResponse containing the updated user response DTO
   */
  async updateEmail(changeMailDto: ChangeMailDto, currentUser: User): Promise<ApiResponse<{ user: UserResponseDto }>> {
    currentUser.email = changeMailDto.email;
    const updatedUser = await this.update(currentUser.id, currentUser);
    return ApiResponse.success('Email changed successfully.', { user: new UserResponseDto(updatedUser) });
  }
}
