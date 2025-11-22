import { Injectable, ConflictException, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto';
import { UserStatus, UserRole, WorkRole } from './enums/user.enum';
import { USER_CONSTANTS } from './constants/user.constants';
import { EmailService } from '../../core/services/email/email.service';

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
    private readonly emailService: EmailService,
  ) {}

  /**
   * Create a new user
   * @param createUserDto - User creation data
   * @returns Created user response DTO
   */
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Check if email already exists
    const emailCount = await this.userRepository.count({
      where: { email: createUserDto.email },
    });
    if (emailCount > 0) {
      throw new ConflictException('Email already exists');
    }

    // Check if mobile number already exists
    const mobileCount = await this.userRepository.count({
      where: { mobileNumber: createUserDto.mobileNumber },
    });
    if (mobileCount > 0) {
      throw new ConflictException('Mobile number already exists');
    }

    // Find referrer if referral code provided
    let referrer: User | null = null;
    if (createUserDto.referralCode) {
      referrer = await this.userRepository.findOne({
        where: { referralCode: createUserDto.referralCode },
      });
      if (!referrer) {
        throw new BadRequestException('Invalid referral code');
      }
    }

    // Generate unique referral code
    const referralCode = await this.generateUniqueReferralCode();

    // Hash password
    const passwordHash = await bcrypt.hash(createUserDto.password, USER_CONSTANTS.SALT_ROUNDS);

    // Create user entity
    const user = this.userRepository.create({
      fullName: createUserDto.fullName,
      email: createUserDto.email,
      mobileNumber: createUserDto.mobileNumber,
      passwordHash,
      passwordUpdatedAt: new Date(),
      referralCode,
      referredByUserId: referrer?.id || null,
      status: UserStatus.ACTIVE,
      isVerified: false,
      role: createUserDto.role || UserRole.USER,
      workRole: createUserDto.workRole || WorkRole.INVESTOR,
      businessDone: '0.00',
    });

    const savedUser = await this.userRepository.save(user);

    // Send welcome email asynchronously (don't wait for it)
    this.emailService.sendWelcomeEmail(savedUser.email, savedUser.fullName, savedUser.referralCode).catch((error) => {
      this.logger.error(`Failed to send welcome email to ${savedUser.email}:`, error);
    });

    this.logger.log(`User created successfully: ${savedUser.email}`);

    return new UserResponseDto(savedUser);
  }

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
    return new UserResponseDto(user);
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
    return new UserResponseDto(user);
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

    // Check email uniqueness if email is being updated
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const emailCount = await this.userRepository.count({
        where: { email: updateUserDto.email },
      });
      if (emailCount > 0) {
        throw new ConflictException('Email already exists');
      }
    }

    // Check mobile number uniqueness if mobile is being updated
    if (updateUserDto.mobileNumber && updateUserDto.mobileNumber !== user.mobileNumber) {
      const mobileCount = await this.userRepository.count({
        where: { mobileNumber: updateUserDto.mobileNumber },
      });
      if (mobileCount > 0) {
        throw new ConflictException('Mobile number already exists');
      }
    }

    // Update user fields
    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);

    this.logger.log(`User updated: ${id}`);
    return new UserResponseDto(updatedUser);
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

  /**
   * Generate a unique referral code
   * @returns Unique referral code
   */
  private async generateUniqueReferralCode(): Promise<string> {
    let referralCode: string;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < USER_CONSTANTS.MAX_REFERRAL_CODE_ATTEMPTS) {
      // Generate referral code with specified length
      referralCode = this.generateRandomCode(USER_CONSTANTS.REFERRAL_CODE_LENGTH);
      const existing = await this.userRepository.findOne({
        where: { referralCode },
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new Error('Failed to generate unique referral code');
    }

    return referralCode!;
  }

  /**
   * Generate random alphanumeric code
   * @param length - Code length
   * @returns Random code
   */
  private generateRandomCode(length: number): string {
    const chars = USER_CONSTANTS.REFERRAL_CODE_CHARS;
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
