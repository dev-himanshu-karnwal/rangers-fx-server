import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { EmailService } from '../../../core/services/email/email.service';
import { ConfigService } from '../../../config/config.service';
import { OtpService } from '../../otp/otp.service';
import { SignupInitiateDto, VerifyOtpDto, CompleteSignupDto, AuthResponseDto } from '../dto';
import { OtpPurpose } from '../../otp/enums/otp.enum';
import { ApiResponse } from 'src/common/response/api.response';
import type { Response } from 'express';
import { UserStatus } from '../../user/enums/user.enum';
import { UserResponseDto } from '../../user/dto';
import { AuthTokenService } from './auth-token.service';

/**
 * Auth Signup Service - handles signup-related operations
 * Follows Single Responsibility Principle - handles signup operations only
 */
@Injectable()
export class AuthSignupService {
  private readonly logger = new Logger(AuthSignupService.name);

  constructor(
    private readonly userService: UserService,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly authTokenService: AuthTokenService,
  ) {}

  /**
   * Step 1: Initiate signup - create user without password, send OTP
   * @param signupInitiateDto - Signup initiation data (email, name, referralCode)
   * @returns Success response without user data
   */
  async signupInitiate(signupInitiateDto: SignupInitiateDto): Promise<ApiResponse<null>> {
    // Delete OTPs for existing unverified user (if any) before creating new user
    const existingUser = await this.userService.findByEmail(signupInitiateDto.email);
    if (existingUser && existingUser.status === UserStatus.UNVERIFIED) {
      await this.otpService.deleteAllOtpForUser(existingUser.email);
    }

    // Create unverified user (UserService handles validation and cleanup)
    const savedUser = await this.userService.createUnverifiedUser(
      signupInitiateDto.email,
      signupInitiateDto.fullName,
      signupInitiateDto.referredByUserId,
    );

    // Generate and send OTP
    const otpCode = await this.otpService.generateOtp(savedUser.email, OtpPurpose.SIGNUP);

    if (this.configService.isProduction) {
      await this.emailService.sendVerificationEmail(savedUser.email, savedUser.fullName, otpCode);
    }

    this.logger.log(`Signup initiated for user: ${savedUser.email}`);

    return ApiResponse.success('OTP Sent Successfully.');
  }

  /**
   * Step 2: Verify OTP - common API for all OTP verification purposes
   * @param verifyOtpDto - OTP verification data (userEmail, otp, purpose)
   * @returns Success message
   */
  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<ApiResponse<null>> {
    // Verify user exists
    if (verifyOtpDto.purpose !== OtpPurpose.VERIFY) {
      const user = await this.userService.findByEmail(verifyOtpDto.userEmail);
      if (!user) {
        throw new NotFoundException('User not found');
      }
    }

    // Match OTP
    const { isMatched, message } = await this.otpService.matchOtp(
      verifyOtpDto.userEmail,
      verifyOtpDto.otp,
      verifyOtpDto.purpose,
    );

    if (!isMatched) {
      throw new BadRequestException(message);
    }

    // Mark user as verified
    await this.userService.verifyUser(verifyOtpDto.userEmail);

    this.logger.log(`OTP verified for user: ${verifyOtpDto.userEmail}, purpose: ${verifyOtpDto.purpose}`);

    return ApiResponse.success(message, null);
  }

  /**
   * Step 3: Complete signup - set password, generate referral code, verify user
   * @param completeSignupDto - Complete signup data (userEmail, password)
   * @param res - Express response object for setting cookies
   * @returns Authentication response with token and user
   */
  async completeSignup(completeSignupDto: CompleteSignupDto, res: Response): Promise<ApiResponse<AuthResponseDto>> {
    // Complete user signup (UserService handles password, referral code, wallet, closure)
    const updatedUser = await this.userService.completeUserSignup(
      completeSignupDto.userEmail,
      completeSignupDto.password,
    );

    // Generate JWT token
    const accessToken = this.authTokenService.generateToken(updatedUser);

    // Storing jwt in cookie
    this.authTokenService.storeValueInCookie(res, this.configService.authTokenCookieKey, accessToken);

    // Get user DTO for response
    const userResponse = await this.userService.findOne(updatedUser.id);
    await this.emailService.sendWelcomeEmail(updatedUser.email, updatedUser.fullName, updatedUser.referralCode!);

    // Updating parent
    if (userResponse.referredByUserId) {
      const existingParent = await this.userService.findUserByReferredByUserId(userResponse.referredByUserId);
      if (existingParent) {
        const updateUserDto = new UserResponseDto({
          ...existingParent,
          hasChildren: true,
        });
        await this.userService.update(existingParent.id, updateUserDto);
      }
    }

    this.logger.log(`Signup completed for user: ${updatedUser.email}`);

    return ApiResponse.success(
      'Registration completed successfully',
      new AuthResponseDto({
        accessToken,
        user: userResponse,
      }),
    );
  }
}
