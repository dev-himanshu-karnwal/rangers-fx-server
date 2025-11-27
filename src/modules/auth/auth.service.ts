import { Injectable } from '@nestjs/common';
import { User } from '../user/entities/user.entity';
import {
  LoginInitiateDto,
  CompleteLoginDto,
  AuthResponseDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  SignupInitiateDto,
  VerifyOtpDto,
  CompleteSignupDto,
} from './dto';
import { ApiResponse } from '../../common/response/api.response';
import type { Response } from 'express';
import { AuthLoginService, AuthPasswordResetService, AuthSignupService, AuthTokenService } from './services';

/**
 * Auth Service - Orchestrator class that coordinates all authentication-related operations
 * Follows Single Responsibility Principle - orchestrates auth operations by delegating to specialized services
 * This is the main entry point for all auth service consumers
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly authLoginService: AuthLoginService,
    private readonly authPasswordResetService: AuthPasswordResetService,
    private readonly authSignupService: AuthSignupService,
    private readonly authTokenService: AuthTokenService,
  ) {}

  // ==================== Login Operations ====================

  /**
   * Step 1: Initiate login - send OTP to email
   * @param loginInitiateDto - Login initiation data (email)
   * @returns Success response without user data
   */
  async loginInitiate(loginInitiateDto: LoginInitiateDto): Promise<ApiResponse<null>> {
    return this.authLoginService.loginInitiate(loginInitiateDto);
  }

  /**
   * Step 3: Complete login - authenticate with email and password
   * @param completeLoginDto - Complete login data (email, password)
   * @param res - Express response object for setting cookies
   * @returns Authentication response with token and user
   */
  async completeLogin(completeLoginDto: CompleteLoginDto, res: Response): Promise<ApiResponse<AuthResponseDto>> {
    return this.authLoginService.completeLogin(completeLoginDto, res);
  }

  /**
   * Logout service - clears authentication cookie
   * @param res - Express response object
   * @returns Success response
   */
  logout(res: Response): ApiResponse<null> {
    return this.authLoginService.logout(res);
  }

  // ==================== Password Reset Operations ====================

  /**
   * Initiate password reset process - send OTP
   * @param forgotPasswordDto - Email address
   * @returns Success response without user data
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<ApiResponse<null>> {
    return this.authPasswordResetService.forgotPassword(forgotPasswordDto);
  }

  /**
   * Reset password using OTP verification
   * @param resetPasswordDto - User email and new password
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    return this.authPasswordResetService.resetPassword(resetPasswordDto);
  }

  // ==================== Signup Operations ====================

  /**
   * Step 1: Initiate signup - create user without password, send OTP
   * @param signupInitiateDto - Signup initiation data (email, name, referralCode)
   * @returns Success response without user data
   */
  async signupInitiate(signupInitiateDto: SignupInitiateDto): Promise<ApiResponse<null>> {
    return this.authSignupService.signupInitiate(signupInitiateDto);
  }

  /**
   * Step 2: Verify OTP - common API for all OTP verification purposes
   * @param verifyOtpDto - OTP verification data (userEmail, otp, purpose)
   * @returns Success message
   */
  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<ApiResponse<null>> {
    return this.authSignupService.verifyOtp(verifyOtpDto);
  }

  /**
   * Step 3: Complete signup - set password, generate referral code, verify user
   * @param completeSignupDto - Complete signup data (userEmail, password)
   * @param res - Express response object for setting cookies
   * @returns Authentication response with token and user
   */
  async completeSignup(completeSignupDto: CompleteSignupDto, res: Response): Promise<ApiResponse<AuthResponseDto>> {
    return this.authSignupService.completeSignup(completeSignupDto, res);
  }

  // ==================== Token Operations ====================

  /**
   * Validate user for JWT strategy
   * @param userId - User ID
   * @returns User entity
   */
  async validateUser(userId: number): Promise<User> {
    return this.authTokenService.validateUser(userId);
  }
}
