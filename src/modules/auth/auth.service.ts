import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserService } from '../user/user.service';
import { ReferralService } from '../user/services/referral.service';
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
import { UserResponseDto } from '../user/dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AUTH_CONSTANTS } from './constants/auth.constants';
import { OtpPurpose } from '../otp/enums/otp.enum';
import { USER_CONSTANTS } from '../user/constants/user.constants';

/**
 * Auth service handling authentication and authorization logic
 * Follows Single Responsibility Principle - handles auth-related business logic only
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly referralService: ReferralService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Step 1: Initiate login - send OTP to email
   * @param loginInitiateDto - Login initiation data (email)
   * @returns User response DTO
   */
  async loginInitiate(loginInitiateDto: LoginInitiateDto): Promise<UserResponseDto> {
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
    const otpCode = await this.otpService.generateOtp(user.id, OtpPurpose.LOGIN);
    await this.emailService.sendVerificationEmail(user.email, user.fullName, otpCode);

    this.logger.log(`Login OTP sent to user: ${user.email}`);

    return new UserResponseDto({});
  }

  /**
   * Step 3: Complete login - authenticate with email and password
   * @param completeLoginDto - Complete login data (email, password)
   * @returns Authentication response with token and user
   */
  async completeLogin(completeLoginDto: CompleteLoginDto): Promise<AuthResponseDto> {
    // Find user by email with password
    const user = await this.userService.findByEmailWithPassword(completeLoginDto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(completeLoginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const accessToken = this.generateToken(user);

    // Get user DTO for response
    const userResponse = await this.userService.findOne(user.id);

    this.logger.log(`User logged in: ${user.email}`);

    return new AuthResponseDto({
      accessToken,
      user: userResponse,
    });
  }

  /**
   * Initiate password reset process
   * @param forgotPasswordDto - Email address
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const user = await this.userService.findByEmailWithPassword(forgotPasswordDto.email);
    if (!user) {
      // Don't reveal if email exists for security
      this.logger.warn(`Password reset requested for non-existent email: ${forgotPasswordDto.email}`);
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + AUTH_CONSTANTS.RESET_TOKEN_EXPIRATION_HOURS);

    // Save reset token to user
    await this.userService.updateResetToken(user.id, resetToken, resetExpires);

    // Send password reset email
    await this.emailService.sendPasswordResetEmail(user.email, user.fullName, resetToken);

    this.logger.log(`Password reset email sent to: ${user.email}`);
  }

  /**
   * Reset password using reset token
   * @param resetPasswordDto - Reset token and new password
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const user = await this.userService.findByResetToken(resetPasswordDto.token);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check if token has expired
    if (!user.resetPasswordExpiresAt || user.resetPasswordExpiresAt < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    // Update password
    await this.userService.updatePassword(user.id, resetPasswordDto.newPassword);

    // Clear reset token
    await this.userService.updateResetToken(user.id, null, null);

    this.logger.log(`Password reset successful for user: ${user.id}`);
  }

  /**
   * Step 1: Initiate signup - create user without password, send OTP
   * @param signupInitiateDto - Signup initiation data (email, name, referralCode)
   * @returns Created user response DTO
   */
  async signupInitiate(signupInitiateDto: SignupInitiateDto): Promise<UserResponseDto> {
    // Check if email already exists
    const existingUser = await this.userService.findByEmail(signupInitiateDto.email);
    if (existingUser) {
      // If user is verified, throw error
      if (existingUser.isVerified) {
        throw new ConflictException('Email already exists');
      }

      // If user is not verified, delete the old entry and related OTPs
      this.logger.log(`Deleting unverified user with email: ${existingUser.email}`);

      // Delete OTPs associated with this user
      await this.otpService.deleteAllOtpForUser(existingUser.id);

      // Delete the unverified user
      await this.userRepository.delete(existingUser.id);

      this.logger.log(`Deleted unverified user: ${existingUser.id}`);
    }

    // Find referrer if referral code provided
    const referrer: User = await this.referralService.validateReferralCode(signupInitiateDto.referralCode);

    // Create user entity without password
    const user = this.userRepository.create({
      fullName: signupInitiateDto.fullName,
      email: signupInitiateDto.email,
      referredByUserId: referrer.id,
    });

    const savedUser = await this.userRepository.save(user);

    // Generate and send OTP
    const otpCode = await this.otpService.generateOtp(savedUser.id, OtpPurpose.SIGNUP);
    await this.emailService.sendVerificationEmail(savedUser.email, savedUser.fullName, otpCode);

    this.logger.log(`Signup initiated for user: ${savedUser.email}`);

    return new UserResponseDto(savedUser);
  }

  /**
   * Step 2: Verify OTP - common API for all OTP verification purposes
   * @param verifyOtpDto - OTP verification data (userId, otp, purpose)
   * @returns Success message
   */
  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{ message: string }> {
    // Verify user exists
    const user = await this.userService.findByIdEntity(verifyOtpDto.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Match OTP
    const isValid = await this.otpService.matchOtp(verifyOtpDto.userId, verifyOtpDto.otp, verifyOtpDto.purpose);

    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    this.logger.log(`OTP verified for user: ${verifyOtpDto.userId}, purpose: ${verifyOtpDto.purpose}`);

    return { message: 'OTP verified successfully' };
  }

  /**
   * Step 3: Complete signup - set password, generate referral code, verify user
   * @param completeSignupDto - Complete signup data (userId, password)
   * @returns Authentication response with token and user
   */
  async completeSignup(completeSignupDto: CompleteSignupDto): Promise<AuthResponseDto> {
    // Find user
    const user = await this.userService.findByIdEntity(completeSignupDto.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already has a password (already completed signup)
    if (user.passwordHash) {
      throw new BadRequestException('User signup already completed');
    }

    // Check if user is verified (should be verified via OTP in step 2)
    // Note: We're setting isVerified to true here, but ideally it should be set after OTP verification
    // For now, we'll set it here as per requirements

    // Generate unique referral code
    const referralCode = await this.referralService.generateUniqueReferralCode();

    // Hash password
    const passwordHash = await bcrypt.hash(completeSignupDto.password, USER_CONSTANTS.SALT_ROUNDS);

    // Update user with password, referral code, and verification status
    user.passwordHash = passwordHash;
    user.passwordUpdatedAt = new Date();
    user.referralCode = referralCode;
    user.isVerified = true;

    const updatedUser = await this.userRepository.save(user);

    // Generate JWT token
    const accessToken = this.generateToken(updatedUser);

    // Get user DTO for response
    const userResponse = await this.userService.findOne(updatedUser.id);

    this.logger.log(`Signup completed for user: ${updatedUser.email}`);

    return new AuthResponseDto({
      accessToken,
      user: userResponse,
    });
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
}
