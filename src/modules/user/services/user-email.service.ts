import { Injectable, Logger } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { ChangeMailDto, EmailVerifyDTO, UserResponseDto } from '../dto';
import { ApiResponse } from '../../../common/response/api.response';
import { OtpService } from '../../otp/otp.service';
import { OtpPurpose } from '../../otp/enums';
import { EmailService } from '../../../core/services/email/email.service';
import { ConfigService } from '../../../config/config.service';
import { UserUpdateService } from './user-update.service';

/**
 * User Email Service - handles all email-related operations
 * Follows Single Responsibility Principle - handles email operations only
 */
@Injectable()
export class UserEmailService {
  private readonly logger = new Logger(UserEmailService.name);

  constructor(
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly userUpdateService: UserUpdateService,
  ) {}

  /**
   * Initiate change email process by sending an OTP to the user's current (old) email.
   * @param emailVerifyDTO - DTO containing `email`
   * @returns ApiResponse with success message if OTP was generated/sent
   */
  async verifyEmail(emailVerifyDTO: EmailVerifyDTO): Promise<ApiResponse<null>> {
    // Generate and send OTP
    const otpCode = await this.otpService.generateOtp(emailVerifyDTO.email, OtpPurpose.VERIFY);
    if (this.configService.isProduction) {
      await this.emailService.sendVerificationEmail(emailVerifyDTO.email, 'user', otpCode);
    }

    this.logger.log(`Login OTP sent to user: ${emailVerifyDTO.email}`);

    return ApiResponse.success('OTP Sent Successfully.', null);
  }

  /**
   * Complete change email process by updating the user's email after verification.
   * - Finds the user by `oldEmail`, updates to `newEmail` and returns updated user DTO
   * @param changeMailDto - DTO containing `email` (new email)
   * @param currentUser - Current authenticated user
   * @returns ApiResponse containing the updated user response DTO
   */
  async updateEmail(changeMailDto: ChangeMailDto, currentUser: User): Promise<ApiResponse<{ user: UserResponseDto }>> {
    currentUser.email = changeMailDto.email;
    const updatedUser = await this.userUpdateService.update(currentUser.id, currentUser);
    return ApiResponse.success('Email changed successfully.', { user: new UserResponseDto(updatedUser) });
  }
}
