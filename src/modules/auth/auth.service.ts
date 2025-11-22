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
import { OtpPurpose } from '../otp/enums/otp.enum';
import { USER_CONSTANTS } from '../user/constants/user.constants';
import { ApiResponse } from 'src/common/response/api.response';

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

    // Check if a LOGIN OTP still exists for this user
    const existingLoginOtp = await this.otpService.findActiveOtp(user.id, OtpPurpose.LOGIN);
    if (existingLoginOtp) {
      throw new BadRequestException('An active login OTP still exists. Please use the OTP or wait until it expires.');
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
   * Initiate password reset process - send OTP
   * @param forgotPasswordDto - Email address
   * @returns User response DTO with userId
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<UserResponseDto> {
    const user = await this.userService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate and send OTP
    const otpCode = await this.otpService.generateOtp(user.id, OtpPurpose.FORGOT_PASSWORD);
    await this.emailService.sendVerificationEmail(user.email, user.fullName, otpCode);

    this.logger.log(`Forgot password OTP sent to user: ${user.email}`);

    // Return user with userId
    return new UserResponseDto({ id: user.id });
  }

  /**
   * Reset password using OTP verification
   * @param resetPasswordDto - User ID and new password
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    // Find user
    const user = await this.userService.findByIdEntity(resetPasswordDto.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if a FORGOT_PASSWORD OTP still exists for this user (same as login check)
    const existingForgotPasswordOtp = await this.otpService.findActiveOtp(
      resetPasswordDto.userId,
      OtpPurpose.FORGOT_PASSWORD,
    );
    if (existingForgotPasswordOtp) {
      throw new BadRequestException('An active forgot password OTP still exists. Please verify the OTP first.');
    }

    // Update password
    await this.userService.updatePassword(resetPasswordDto.userId, resetPasswordDto.newPassword);

    this.logger.log(`Password reset successful for user: ${resetPasswordDto.userId}`);
  }

  /**
   * Step 1: Initiate signup - create user without password, send OTP
   * @param signupInitiateDto - Signup initiation data (email, name, referralCode)
   * @returns Created user response DTO
   */
  async signupInitiate(signupInitiateDto: SignupInitiateDto): Promise<ApiResponse<UserResponseDto>> {
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
    const referrer: User | null = await this.userService.findByIdEntity(signupInitiateDto.referredByUserId);
    if (!referrer) {
      throw new NotFoundException('Referrer not found');
    }

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

    return ApiResponse.success('OTP Sent Successfully. ', new UserResponseDto(savedUser));
  }

  /**
   * Step 2: Verify OTP - common API for all OTP verification purposes
   * @param verifyOtpDto - OTP verification data (userId, otp, purpose)
   * @returns Success message
   */
  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<ApiResponse<null>> {
    // Verify user exists
    const user = await this.userService.findByIdEntity(verifyOtpDto.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Match OTP
    const { isMatched, message } = await this.otpService.matchOtp(
      verifyOtpDto.userId,
      verifyOtpDto.otp,
      verifyOtpDto.purpose,
    );

    if (!isMatched) {
      throw new BadRequestException(message);
    }

    this.logger.log(`OTP verified for user: ${verifyOtpDto.userId}, purpose: ${verifyOtpDto.purpose}`);

    return ApiResponse.success(message, null);
  }

  /**
   * Step 3: Complete signup - set password, generate referral code, verify user
   * @param completeSignupDto - Complete signup data (userId, password)
   * @returns Authentication response with token and user
   */
  async completeSignup(completeSignupDto: CompleteSignupDto): Promise<ApiResponse<AuthResponseDto>> {
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
}
