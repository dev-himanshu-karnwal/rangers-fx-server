import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Otp } from './entities/otp.entity';
import { OtpService } from './otp.service';

/**
 * OTP module - handles OTP generation, validation, and management
 * Exports OtpService for use in other modules (e.g., AuthModule)
 */
@Module({
  imports: [TypeOrmModule.forFeature([Otp])],
  providers: [OtpService],
  exports: [OtpService], // Export for other modules
})
export class OtpModule {}
