import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
   * @param userId - User ID
   * @param purpose - Purpose of the OTP
   * @returns Generated OTP code
   */
  async generateOtp(userId: number, purpose: OtpPurpose): Promise<string> {
    // Delete any existing OTPs for the same user and purpose
    await this.otpRepository.delete({
      userId,
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
      userId,
      purpose,
      expiresAt,
    });

    await this.otpRepository.save(otp);

    return otpCode;
  }

  /**
   * Match an OTP - if matched, delete and return true
   * @param userId - User ID
   * @param otpCode - OTP code to match
   * @param purpose - Purpose of the OTP
   * @returns True if OTP matches, false otherwise
   */
  async matchOtp(userId: number, otpCode: string, purpose: OtpPurpose): Promise<boolean> {
    // Find the OTP
    const otp = await this.otpRepository.findOne({
      where: {
        userId,
        otp: otpCode,
        purpose,
      },
    });

    if (!otp) {
      return false;
    }

    // Check if OTP is expired
    if (new Date() > otp.expiresAt) {
      // Delete expired OTP
      await this.otpRepository.delete(otp.id);
      return false;
    }

    // OTP matched - delete it and return success
    await this.otpRepository.delete(otp.id);
    return true;
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
}
