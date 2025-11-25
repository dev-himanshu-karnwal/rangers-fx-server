import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserService } from '../../user/user.service';
import { User } from '../../user/entities/user.entity';
import { EmailService } from '../../../core/services/email/email.service';
import { ConfigService } from '../../../config/config.service';
import { OtpService } from '../../otp/otp.service';
import { LoginInitiateDto, CompleteLoginDto, AuthResponseDto } from '../dto';
import { OtpPurpose } from '../../otp/enums/otp.enum';
import { ApiResponse } from 'src/common/response/api.response';
import type { Response } from 'express';
import { UserStatus } from '../../user/enums/user.enum';
import { AuthTokenService } from './auth-token.service';

/**
 * Auth Login Service - handles login-related operations
 * Follows Single Responsibility Principle - handles login operations only
 */
@Injectable()
export class AuthLoginService {
  private readonly logger = new Logger(AuthLoginService.name);

  constructor(
    private readonly userService: UserService,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly authTokenService: AuthTokenService,
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

    // Check if user is verified (status should not be unverified)
    if (user.status === UserStatus.UNVERIFIED) {
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
   * Step 3: Complete login - authenticate with email and password
   * @param completeLoginDto - Complete login data (email, password)
   * @param res - Express response object for setting cookies
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
    const accessToken = this.authTokenService.generateToken(user);

    // Storing jwt in cookie
    this.authTokenService.storeValueInCookie(res, this.configService.authTokenCookieKey, accessToken);

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
   * Logout service - clears authentication cookie
   * @param res - Express response object
   * @returns Success response
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
}
