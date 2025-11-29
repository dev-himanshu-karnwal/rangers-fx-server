import { Injectable } from '@nestjs/common';
import { FindOneOptions } from 'typeorm';
import { User } from './entities/user.entity';
import { ChangeMailDto, ChangePasswordDto, EmailVerifyDTO, UpdateUserDto, UserResponseDto } from './dto';
import { ApiResponse } from '../../common/response/api.response';
import { UserStatus, WorkRole } from './enums/user.enum';
import { QueryParamsDto } from '../../common/query';
import {
  UserQueryService,
  UserPasswordService,
  UserEmailService,
  UserSignupService,
  UserVerificationService,
  UserResetTokenService,
  UserUpdateService,
} from './services';

/**
 * User Service - Orchestrator class that coordinates all user-related operations
 * Follows Single Responsibility Principle - orchestrates user operations by delegating to specialized services
 * This is the main entry point for all user service consumers
 */
@Injectable()
export class UserService {
  constructor(
    private readonly userQueryService: UserQueryService,
    private readonly userPasswordService: UserPasswordService,
    private readonly userEmailService: UserEmailService,
    private readonly userSignupService: UserSignupService,
    private readonly userVerificationService: UserVerificationService,
    private readonly userResetTokenService: UserResetTokenService,
    private readonly userUpdateService: UserUpdateService,
  ) {}

  // ==================== Query Operations ====================

  /**
   * Find user by ID
   * @param id - User ID
   * @returns User response DTO
   */
  async findOne(id: number): Promise<UserResponseDto> {
    return this.userQueryService.findOne(id);
  }

  /**
   * Find user by referral code
   * @param referralCode - Referral code
   * @returns User response DTO
   */
  async findOneByReferralCode(referralCode: string): Promise<UserResponseDto> {
    return this.userQueryService.findOneByReferralCode(referralCode);
  }

  /**
   * Find user by email
   * @param email - User email
   * @returns User response DTO wrapped in ApiResponse
   */
  async getUserByEmail(email: string): Promise<ApiResponse<{ user: UserResponseDto }>> {
    return this.userQueryService.getUserByEmail(email);
  }

  /**
   * Find user by wallet ID
   * @param walletId - Wallet ID
   * @returns User response DTO wrapped in ApiResponse
   */
  async getUserByWalletId(walletId: number): Promise<ApiResponse<{ user: UserResponseDto }>> {
    return this.userQueryService.getUserByWalletId(walletId);
  }

  /**
   * Find user by email (internal use)
   * @param email - User email
   * @param options - Optional find options
   * @returns User entity or null
   */
  async findByEmail(email: string, options?: FindOneOptions<User>): Promise<User | null> {
    return this.userQueryService.findByEmail(email, options);
  }

  /**
   * Find user by email with password hash (for authentication)
   * @param email - User email
   * @returns User entity with password hash or null
   */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userQueryService.findByEmail(email);
  }

  /**
   * Find user by ID (returns entity for internal use)
   * @param id - User ID
   * @returns User entity or null
   */
  async findByIdEntity(id: number): Promise<User | null> {
    return this.userQueryService.findByIdEntity(id);
  }

  /**
   * Find User by referredByUserId
   * @param referredByUserId - Referrer user ID
   * @returns User Entity or null
   */
  async findUserByReferredByUserId(referredByUserId: number): Promise<User | null> {
    return this.userQueryService.findUserByReferredByUserId(referredByUserId);
  }

  /**
   * Find user by reset password token
   * @param token - Reset password token
   * @returns User entity or null
   */
  async findByResetToken(token: string): Promise<User | null> {
    return this.userResetTokenService.findByResetToken(token);
  }

  /**
   * Find all direct children (referrals) of a user by their user ID.
   * @param id - The ID of the parent/referrer user.
   * @param query - Query parameters (pagination, sorting, filters)
   * @returns A list of User entities wrapped in ApiResponse
   */
  async findDirectChildrenOfUserById(
    id: number,
    query: QueryParamsDto,
  ): Promise<
    ApiResponse<{
      meta: {
        total: number;
        page: number;
        limit: number;
      };
      users: UserResponseDto[];
    }>
  > {
    return this.userQueryService.findDirectChildrenOfUserById(id, query);
  }

  /**
   * Get current user profile
   * @param user - User entity
   * @returns User profile response
   */
  async getMe(user: User): Promise<ApiResponse<{ user: UserResponseDto }>> {
    return this.userQueryService.getMe(user);
  }

  // ==================== Password Operations ====================

  /**
   * Update user password
   * @param id - User ID
   * @param newPassword - New password
   */
  async updatePassword(id: number, newPassword: string): Promise<void> {
    return this.userPasswordService.updatePassword(id, newPassword);
  }

  /**
   * Change password for the current authenticated user.
   * @param changePasswordDto - Contains `oldPassword` and `newPassword`
   * @param user - Current authenticated user (from controller)
   * @returns ApiResponse<null> on success
   */
  async changePassword(changePasswordDto: ChangePasswordDto, user: User): Promise<ApiResponse<null>> {
    return this.userPasswordService.changePassword(changePasswordDto, user);
  }

  // ==================== Email Operations ====================

  /**
   * Initiate change email process by sending an OTP to the user's email.
   * @param emailVerifyDTO - DTO containing `email`
   * @returns ApiResponse with success message if OTP was generated/sent
   */
  async verifyEmail(emailVerifyDTO: EmailVerifyDTO): Promise<ApiResponse<null>> {
    return this.userEmailService.verifyEmail(emailVerifyDTO);
  }

  /**
   * Complete change email process by updating the user's email after verification.
   * @param changeMailDto - DTO containing `email` (new email)
   * @param currentUser - Current authenticated user
   * @returns ApiResponse containing the updated user response DTO
   */
  async updateEmail(changeMailDto: ChangeMailDto, currentUser: User): Promise<ApiResponse<{ user: UserResponseDto }>> {
    return this.userEmailService.updateEmail(changeMailDto, currentUser);
  }

  // ==================== Signup Operations ====================

  /**
   * Create an unverified user (for signup initiation)
   * @param email - User email
   * @param fullName - User full name
   * @param referredByUserId - Referrer user ID
   * @returns Created user entity
   */
  async createUnverifiedUser(email: string, fullName: string, referredByUserId: number): Promise<User> {
    return this.userSignupService.createUnverifiedUser(email, fullName, referredByUserId);
  }

  /**
   * Complete user signup - set password, generate referral code, create wallet and closure entries
   * @param userEmail - User email
   * @param password - User password
   * @returns Updated user entity
   */
  async completeUserSignup(userEmail: string, password: string): Promise<User> {
    return this.userSignupService.completeUserSignup(userEmail, password);
  }

  // ==================== Verification Operations ====================

  /**
   * Mark user as verified (change status to inactive)
   * @param email - User email
   */
  async verifyUser(email: string): Promise<void> {
    return this.userVerificationService.verifyUser(email);
  }

  // ==================== Reset Token Operations ====================

  /**
   * Update reset password token and expiration
   * @param id - User ID
   * @param token - Reset token (null to clear)
   * @param expiresAt - Expiration date (null to clear)
   */
  async updateResetToken(id: number, token: string | null, expiresAt: Date | null): Promise<void> {
    return this.userResetTokenService.updateResetToken(id, token, expiresAt);
  }

  // ==================== Update Operations ====================

  /**
   * Update user information
   * @param id - User ID
   * @param updateUserDto - Update data
   * @returns Updated user response DTO
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    return this.userUpdateService.update(id, updateUserDto);
  }

  /**
   * Save user
   * @param user - User to save
   * @returns Saved user
   */
  async saveUser(user: User): Promise<User> {
    return this.userUpdateService.saveUser(user);
  }

  /**
   * Increments the direct children count for a user by ID
   * Uses query builder to safely update only this field without affecting relations
   * @param userId - User ID to increment children count for
   */
  async incrementDirectChildrenCount(userId: number): Promise<void> {
    return this.userUpdateService.incrementDirectChildrenCount(userId);
  }

  /**
   * Updates the work role for a user by ID
   * Uses query builder to safely update only this field without affecting relations
   * @param userId - User ID to update work role for
   * @param workRole - New work role value
   */
  async updateWorkRole(userId: number, workRole: WorkRole): Promise<void> {
    return this.userUpdateService.updateWorkRole(userId, workRole);
  }

  /**
   * Update personal details for the authenticated user.
   * @param updateUserDto - Partial user fields for personal details update
   * @param currentUser - Current authenticated user entity
   * @returns ApiResponse containing the updated `UserResponseDto`
   */
  async updatePersonalDetails(
    updateUserDto: UpdateUserDto,
    currentUser: User,
  ): Promise<ApiResponse<{ user: UserResponseDto }>> {
    const result = await this.userUpdateService.updatePersonalDetails(updateUserDto, currentUser);
    return ApiResponse.success('Personal details updated successfully.', result);
  }

  /**
   * Deactivates a user by setting status to INACTIVE
   * @param user - User entity to deactivate
   * @returns Updated user entity
   */
  async deactivateUser(user: User): Promise<User> {
    return this.userUpdateService.inactivateUser(user);
  }

  /**
   * Updates user role to investor if currently none and activates user
   * @param user - User entity
   * @returns Updated user entity
   */
  async updateUserRoleToInvestorIfNeeded(user: User): Promise<User> {
    if (user.workRole === WorkRole.NONE) {
      user.workRole = WorkRole.INVESTOR;
    }
    return this.saveUser(user);
  }

  /**
   * Increments the business done amount for a user
   * @param user - User entity to increment business done amount
   * @param amount - Amount to increment
   * @returns Updated user entity
   */
  async incrementBusinessDone(user: User, amount: number): Promise<User> {
    return this.userUpdateService.incrementBusinessDone(user, amount);
  }
}
