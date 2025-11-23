import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Otp } from './entities/otp.entity';
import { OtpPurpose } from './enums/otp.enum';
import { OTP_CONSTANTS } from './constants/otp.constants';

/**
 * OTP service - simple OTP generation and matching
 */
@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
  ) {}

  /**
   * Generate a new OTP for a user
   * @param userEmail - User email
   * @param purpose - Purpose of the OTP
   * @returns Generated OTP code
   */
  async generateOtp(userEmail: string, purpose: OtpPurpose): Promise<string> {
    // Delete any existing OTPs for the same user and purpose
    await this.otpRepository.delete({
      userEmail,
      purpose,
    });

    // Generate new OTP
    const otpCode = this.generateRandomOtp();

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_CONSTANTS.OTP_EXPIRY_MINUTES);

    // Create and save OTP
    const otp = this.otpRepository.create({
      otp: otpCode,
      userEmail,
      purpose,
      expiresAt,
    });

    await this.otpRepository.save(otp);

    return otpCode;
  }

  /**
   * Match an OTP - if matched, delete and return true
   * @param userEmail - User email
   * @param otpCode - OTP code to match
   * @param purpose - Purpose of the OTP
   * @returns True if OTP matches, false otherwise
   */
  async matchOtp(
    userEmail: string,
    otpCode: string,
    purpose: OtpPurpose,
  ): Promise<{ isMatched: boolean; message: string }> {
    // Find the OTP
    const otp = await this.otpRepository.findOne({
      where: {
        userEmail,
        otp: otpCode,
        purpose,
      },
    });

    if (!otp) {
      return { isMatched: false, message: 'OTP is Invalid' };
    }

    // Check if OTP is expired
    if (new Date() > otp.expiresAt) {
      // Delete expired OTP
      await this.otpRepository.delete(otp.id);
      return { isMatched: false, message: 'Otp is Expired' };
    }

    // OTP matched - delete it and return success
    await this.otpRepository.delete(otp.id);
    return { isMatched: true, message: 'Otp Verified Successfully' };
  }

  /**
   * Generate a random OTP code
   */
  private generateRandomOtp(): string {
    const chars = OTP_CONSTANTS.OTP_CHARS;
    let result = '';
    for (let i = 0; i < OTP_CONSTANTS.OTP_LENGTH; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Delete all OTPs for a user
   * @param userEmail - User email
   */
  async deleteAllOtpForUser(userEmail: string): Promise<void> {
    await this.otpRepository.delete({ userEmail });
  }

  /**
   * Find an active OTP for a user and purpose
   * @param userEmail - User email
   * @param purpose - Purpose of the OTP
   * @returns OTP entity or null
   */
  async findActiveOtp(userEmail: string, purpose: OtpPurpose): Promise<Otp | null> {
    return this.otpRepository.findOne({ where: { userEmail, purpose, expiresAt: MoreThan(new Date()) } });
  }
}
