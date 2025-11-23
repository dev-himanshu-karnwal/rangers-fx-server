import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import { EmailService } from '../../core/services/email/email.service';
import { ConfigService } from '../../config/config.service';
import { OtpService } from '../otp/otp.service';
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
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { OtpPurpose } from '../otp/enums/otp.enum';
import { ApiResponse } from 'src/common/response/api.response';
import type { Response } from 'express';
import { UserResponseDto } from '../user/dto';

/**
 * Auth service handling authentication and authorization logic
 * Follows Single Responsibility Principle - handles auth-related business logic only
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
  ) {}

  /**
   * Step 1: Initiate login - send OTP to email
   * @param loginInitiateDto - Login initiation data (email)
   * @returns Success response without user data
   */
  async loginInitiate(loginInitiateDto: LoginInitiateDto): Promise<ApiResponse<null>> {
    // Find user by email
    const user = await this.userService.findByEmail(loginInitiateDto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is verified
    if (!user.isVerified) {
      throw new BadRequestException('User email not verified');
    }

    // Check if user has a password (user must have completed signup)
    if (!user.passwordHash) {
      throw new BadRequestException('User signup not completed');
    }

    // Generate and send OTP
    const otpCode = await this.otpService.generateOtp(user.email, OtpPurpose.LOGIN);
    if (this.configService.isProduction) {
      await this.emailService.sendVerificationEmail(user.email, user.fullName, otpCode);
    }

    this.logger.log(`Login OTP sent to user: ${user.email}`);

    return ApiResponse.success('OTP Sent Successfully.', null);
  }

  /**
   * Logut service
   */
  logout(res: Response): ApiResponse<null> {
    res.clearCookie(this.configService.authTokenCookieKey, {
      httpOnly: true,
      secure: this.configService.isProduction,
      sameSite: this.configService.isProduction ? 'strict' : 'lax',
      path: '/', // must match exactly
    });
    return ApiResponse.success('Logout Successfully.');
  }

  /**
   * Step 3: Complete login - authenticate with email and password
   * @param completeLoginDto - Complete login data (email, password)
   * @returns Authentication response with token and user
   */
  async completeLogin(completeLoginDto: CompleteLoginDto, res: Response): Promise<ApiResponse<AuthResponseDto>> {
    // Find user by email with password
    const user = await this.userService.findByEmailWithPassword(completeLoginDto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if a LOGIN OTP still exists for this user
    const existingLoginOtp = await this.otpService.findActiveOtp(user.email, OtpPurpose.LOGIN);
    if (existingLoginOtp) {
      throw new BadRequestException('An active login OTP still exists. Please use the OTP or wait until it expires.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(completeLoginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password is Invalid.');
    }

    // Generate JWT token
    const accessToken = this.generateToken(user);

    // Storing jwt in cookie
    this.storeValueInCookie(res, this.configService.authTokenCookieKey, accessToken);

    // Get user DTO for response
    const userResponse = await this.userService.findOne(user.id);

    this.logger.log(`User logged in: ${user.email}`);

    return ApiResponse.success(
      'Login Successfull',
      new AuthResponseDto({
        accessToken,
        user: userResponse,
      }),
    );
  }

  /**
   * Initiate password reset process - send OTP
   * @param forgotPasswordDto - Email address
   * @returns Success response without user data
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<ApiResponse<null>> {
    const user = await this.userService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate and send OTP
    const otpCode = await this.otpService.generateOtp(user.email, OtpPurpose.FORGOT_PASSWORD);
    if (this.configService.isProduction) {
      await this.emailService.sendVerificationEmail(user.email, user.fullName, otpCode);
    }

    this.logger.log(`Forgot password OTP sent to user: ${user.email}`);

    return ApiResponse.success('Otp Sent Successfully.', null);
  }

  /**
   * Reset password using OTP verification
   * @param resetPasswordDto - User email and new password
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    // Find user
    const user = await this.userService.findByEmail(resetPasswordDto.userEmail);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if a FORGOT_PASSWORD OTP still exists for this user (same as login check)
    const existingForgotPasswordOtp = await this.otpService.findActiveOtp(
      resetPasswordDto.userEmail,
      OtpPurpose.FORGOT_PASSWORD,
    );
    if (existingForgotPasswordOtp) {
      throw new BadRequestException('An active forgot password OTP still exists. Please verify the OTP first.');
    }

    // Update password
    await this.userService.updatePassword(user.id, resetPasswordDto.newPassword);

    this.logger.log(`Password reset successful for user: ${resetPasswordDto.userEmail}`);
  }

  /**
   * Step 1: Initiate signup - create user without password, send OTP
   * @param signupInitiateDto - Signup initiation data (email, name, referralCode)
   * @returns Success response without user data
   */
  async signupInitiate(signupInitiateDto: SignupInitiateDto): Promise<ApiResponse<UserResponseDto>> {
    // Delete OTPs for existing unverified user (if any) before creating new user
    const existingUser = await this.userService.findByEmail(signupInitiateDto.email);
    if (existingUser && !existingUser.isVerified) {
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

    return ApiResponse.success('OTP Sent Successfully. ', new UserResponseDto(savedUser));
  }

  /**
   * Step 2: Verify OTP - common API for all OTP verification purposes
   * @param verifyOtpDto - OTP verification data (userEmail, otp, purpose)
   * @returns Success message
   */
  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<ApiResponse<null>> {
    // Verify user exists
    const user = await this.userService.findByEmail(verifyOtpDto.userEmail);
    if (!user) {
      throw new NotFoundException('User not found');
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
   * @returns Authentication response with token and user
   */
  async completeSignup(completeSignupDto: CompleteSignupDto, res: Response): Promise<ApiResponse<AuthResponseDto>> {
    // Complete user signup (UserService handles password, referral code, wallet, closure)
    const updatedUser = await this.userService.completeUserSignup(
      completeSignupDto.userEmail,
      completeSignupDto.password,
    );

    // Generate JWT token
    const accessToken = this.generateToken(updatedUser);

    // Storing jwt in cookie
    this.storeValueInCookie(res, this.configService.authTokenCookieKey, accessToken);

    // Get user DTO for response
    const userResponse = await this.userService.findOne(updatedUser.id);
    await this.emailService.sendWelcomeEmail(updatedUser.email, updatedUser.fullName, updatedUser.referralCode!);

    //Updating Parent Of current User
    const existingParent = await this.userService.findUserByReferredByUserId(userResponse.referredByUserId!);
    if (!existingParent) {
      throw new NotFoundException("User doesn't exist with referredByUserId for Current User SignUp.");
    }
    existingParent.hasChildren = true;
    await this.userService.update(existingParent.id, existingParent);

    this.logger.log(`Signup completed for user: ${updatedUser.email}`);

    return ApiResponse.success(
      'Registration completed successfully',
      new AuthResponseDto({
        accessToken,
        user: userResponse,
      }),
    );
  }

  /**
   * Validate user for JWT strategy
   * @param userId - User ID
   * @returns User entity
   */
  async validateUser(userId: number): Promise<User> {
    const user = await this.userService.findByIdEntity(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Generate JWT token for user
   * @param user - User entity
   * @returns JWT token string
   */
  private generateToken(user: User): string {
    const payload: JwtPayload = {
      id: user.id,
    };

    const expiresIn = this.configService.jwtExpiresIn;
    return this.jwtService.sign(payload, {
      expiresIn,
    } as any);
  }

  private storeValueInCookie(res: Response, key: string, value: string): void {
    res.cookie(key, value, {
      httpOnly: true,
      secure: this.configService.isProduction, // Only secure in production (HTTPS required)
      sameSite: this.configService.isProduction ? 'strict' : 'lax', // More flexible in development
      maxAge: this.configService.cookieMaxAge,
      path: '/', // Ensure cookie is available for all paths
    });
  }
}
