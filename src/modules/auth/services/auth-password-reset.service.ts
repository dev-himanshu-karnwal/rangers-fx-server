import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { EmailService } from '../../../core/services/email/email.service';
import { ConfigService } from '../../../config/config.service';
import { OtpService } from '../../otp/otp.service';
import { ForgotPasswordDto, ResetPasswordDto } from '../dto';
import { OtpPurpose } from '../../otp/enums/otp.enum';
import { ApiResponse } from 'src/common/response/api.response';

/**
 * Auth Password Reset Service - handles password reset operations
 * Follows Single Responsibility Principle - handles password reset operations only
 */
@Injectable()
export class AuthPasswordResetService {
  private readonly logger = new Logger(AuthPasswordResetService.name);

  constructor(
    private readonly userService: UserService,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

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
}
