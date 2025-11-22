import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import {
  LoginDto,
  AuthResponseDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  SignupInitiateDto,
  VerifyOtpDto,
  CompleteSignupDto,
} from './dto';
import { UserResponseDto } from '../user/dto';

/**
 * Auth controller handling authentication endpoints
 * All routes are public by default (no JWT required)
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Login user
   * @param loginDto - Login credentials
   * @returns Authentication response with token and user
   */
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  /**
   * Request password reset
   * @param forgotPasswordDto - Email address
   */
  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.authService.forgotPassword(forgotPasswordDto);
    return { message: 'If the email exists, a password reset link has been sent' };
  }

  /**
   * Reset password using token
   * @param resetPasswordDto - Reset token and new password
   */
  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    await this.authService.resetPassword(resetPasswordDto);
    return { message: 'Password reset successfully' };
  }

  /**
   * Step 1: Initiate signup - create user without password, send OTP
   * @param signupInitiateDto - Signup initiation data
   * @returns Created user response DTO
   */
  @Post('signup/initiate')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async signupInitiate(@Body() signupInitiateDto: SignupInitiateDto): Promise<UserResponseDto> {
    return this.authService.signupInitiate(signupInitiateDto);
  }

  /**
   * Step 2: Verify OTP - common API for all OTP verification purposes
   * @param verifyOtpDto - OTP verification data
   * @returns Success message
   */
  @Post('otp/verify')
  @Public()
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto): Promise<{ message: string }> {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  /**
   * Step 3: Complete signup - set password, generate referral code, verify user
   * @param completeSignupDto - Complete signup data
   * @returns Authentication response with token and user
   */
  @Post('signup/complete')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async completeSignup(@Body() completeSignupDto: CompleteSignupDto): Promise<AuthResponseDto> {
    return this.authService.completeSignup(completeSignupDto);
  }
}
