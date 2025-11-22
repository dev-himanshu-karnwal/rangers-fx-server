import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UpdateUserDto, UserResponseDto } from './dto';
import { USER_CONSTANTS } from './constants/user.constants';

/**
 * User service handling business logic for user operations
 * Follows Single Responsibility Principle - handles user-related business logic only
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Find user by ID
   * @param id - User ID
   * @returns User response DTO
   */
  async findOne(id: number): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return UserResponseDto.fromEntity(user);
  }

  /**
   * Find user by referral code
   * @param referralCode - Referral code
   * @returns User response DTO
   */
  async findOneByReferralCode(referralCode: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { referralCode } });
    if (!user) {
      throw new NotFoundException(`User with referral code ${referralCode} not found`);
    }
    return UserResponseDto.fromEntity(user);
  }

  /**
   * Find user by email (internal use)
   * @param email - User email
   * @returns User entity or null
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /**
   * Find user by email with password hash (for authentication)
   * @param email - User email
   * @returns User entity with password hash or null
   */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /**
   * Find user by ID (returns entity for internal use)
   * @param id - User ID
   * @returns User entity or null
   */
  async findByIdEntity(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  /**
   * Find user by reset password token
   * @param token - Reset password token
   * @returns User entity or null
   */
  async findByResetToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { resetPasswordToken: token } });
  }

  /**
   * Update reset password token and expiration
   * @param id - User ID
   * @param token - Reset token (null to clear)
   * @param expiresAt - Expiration date (null to clear)
   */
  async updateResetToken(id: number, token: string | null, expiresAt: Date | null): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.resetPasswordToken = token;
    user.resetPasswordExpiresAt = expiresAt;
    await this.userRepository.save(user);
    this.logger.log(`Reset token updated for user: ${id}`);
  }

  /**
   * Update user information
   * @param id - User ID
   * @param updateUserDto - Update data
   * @returns Updated user response DTO
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check email uniqueness
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser && existingUser.id !== user.id) {
        throw new ConflictException('Email already exists');
      }
    }

    // Update user fields
    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);

    this.logger.log(`User updated: ${id}`);
    return UserResponseDto.fromEntity(updatedUser);
  }

  /**
   * Update user password
   * @param id - User ID
   * @param newPassword - New password
   */
  async updatePassword(id: number, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.passwordHash = await bcrypt.hash(newPassword, USER_CONSTANTS.SALT_ROUNDS);
    user.passwordUpdatedAt = new Date();

    await this.userRepository.save(user);
    this.logger.log(`Password updated for user: ${id}`);
  }
}
