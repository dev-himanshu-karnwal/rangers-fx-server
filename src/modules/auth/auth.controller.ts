import { Controller, Post, Body, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
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
import { ApiResponse } from 'src/common/response/api.response';

/**
 * Auth controller handling authentication endpoints
 * All routes are public by default (no JWT required)
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Step 1: Initiate login - send OTP to email
   * @param loginInitiateDto - Login initiation data (email)
   * @returns User response DTO
   */
  @Patch('login/initiate')
  @Public()
  @HttpCode(HttpStatus.OK)
  async loginInitiate(@Body() loginInitiateDto: LoginInitiateDto): Promise<ApiResponse<UserResponseDto>> {
    return this.authService.loginInitiate(loginInitiateDto);
  }

  /**
   * Step 3: Complete login - authenticate with email and password
   * @param completeLoginDto - Complete login data (email, password)
   * @returns Authentication response with token and user
   */
  @Post('login/complete')
  @Public()
  @HttpCode(HttpStatus.OK)
  async completeLogin(@Body() completeLoginDto: CompleteLoginDto): Promise<ApiResponse<AuthResponseDto>> {
    return this.authService.completeLogin(completeLoginDto);
  }

  /**
   * Request password reset - send OTP
   * @param forgotPasswordDto - Email address
   * @returns User response DTO with userId
   */
  @Patch('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<ApiResponse<UserResponseDto>> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  /** 
   * Reset password using OTP verification
   * @param resetPasswordDto - User ID and new password
   */
  @Patch('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<ApiResponse<null>> {
    await this.authService.resetPassword(resetPasswordDto);
    return ApiResponse.success("Password Reset Successfully");
  }

  /**
   * Step 1: Initiate signup - create user without password, send OTP
   * @param signupInitiateDto - Signup initiation data
   * @returns Created user response DTO
   */
  @Post('signup/initiate')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async signupInitiate(@Body() signupInitiateDto: SignupInitiateDto): Promise<ApiResponse<UserResponseDto>> {
    return this.authService.signupInitiate(signupInitiateDto);
  }

  /**
   * Verify OTP - common API for all OTP verification purposes
   * @param verifyOtpDto - OTP verification data
   * @returns Success message
   */
  @Patch('otp/verify')
  @Public()
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto): Promise<ApiResponse<null>> {
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
  async completeSignup(@Body() completeSignupDto: CompleteSignupDto): Promise<ApiResponse<AuthResponseDto>> {
    return this.authService.completeSignup(completeSignupDto);
  }
}
