import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import { EmailService } from '../../core/services/email/email.service';
import { ConfigService } from '../../config/config.service';
import { RegisterDto, LoginDto, AuthResponseDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import { UserResponseDto } from '../user/dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AUTH_CONSTANTS } from './constants/auth.constants';

/**
 * Auth service handling authentication and authorization logic
 * Follows Single Responsibility Principle - handles auth-related business logic only
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new user
   * @param registerDto - Registration data
   * @returns Authentication response with token and user
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Create user using user service
    const userResponse = await this.userService.create({
      fullName: registerDto.fullName,
      email: registerDto.email,
      mobileNumber: registerDto.mobileNumber,
      password: registerDto.password,
      referralCode: registerDto.referralCode,
      workRole: registerDto.workRole,
    });

    // Get full user entity for token generation
    const user = await this.userRepository.findOne({ where: { id: userResponse.id } });
    if (!user) {
      throw new BadRequestException('Failed to create user');
    }

    // Generate JWT token
    const accessToken = this.generateToken(user);

    this.logger.log(`User registered successfully: ${user.email}`);

    return new AuthResponseDto({
      accessToken,
      user: userResponse,
    });
  }

  /**
   * Login user with email and password
   * @param loginDto - Login credentials
   * @returns Authentication response with token and user
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Find user by email
    const user = await this.userRepository.findOne({ where: { email: loginDto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const accessToken = this.generateToken(user);

    this.logger.log(`User logged in: ${user.email}`);

    return new AuthResponseDto({
      accessToken,
      user: new UserResponseDto(user),
    });
  }

  /**
   * Initiate password reset process
   * @param forgotPasswordDto - Email address
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email: forgotPasswordDto.email },
    });
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
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiresAt = resetExpires;
    await this.userRepository.save(user);

    // Send password reset email
    await this.emailService.sendPasswordResetEmail(user.email, user.fullName, resetToken);

    this.logger.log(`Password reset email sent to: ${user.email}`);
  }

  /**
   * Reset password using reset token
   * @param resetPasswordDto - Reset token and new password
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { resetPasswordToken: resetPasswordDto.token },
    });
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
    user.resetPasswordToken = null;
    user.resetPasswordExpiresAt = null;
    await this.userRepository.save(user);

    this.logger.log(`Password reset successful for user: ${user.id}`);
  }

  /**
   * Validate user for JWT strategy
   * @param userId - User ID
   * @returns User entity
   */
  async validateUser(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
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
