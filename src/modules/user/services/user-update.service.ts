import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UpdateUserDto, UserResponseDto } from '../dto';
import { UserStatus, WorkRole } from '../enums/user.enum';

/**
 * User Update Service - handles user update operations
 * Follows Single Responsibility Principle - handles update operations only
 */
@Injectable()
export class UserUpdateService {
  private readonly logger = new Logger(UserUpdateService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
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
    const updatedUser = await this.saveUser(user);

    this.logger.log(`User updated: ${id}`);
    return UserResponseDto.fromEntity(updatedUser);
  }

  /**
   * Save user entity
   * @param user - User to save
   * @returns Saved user
   */
  async saveUser(user: User): Promise<User> {
    return await this.userRepository.save(user);
  }

  /**
   * Update personal details for the authenticated user.
   * - Applies non-sensitive updates (name, contact, profile fields) provided in `updateUserDto`.
   * - Uses the internal `update` method to perform validation and persistence.
   * @param updateUserDto - Partial user fields for personal details update
   * @param currentUser - Current authenticated user entity
   * @returns ApiResponse containing the updated `UserResponseDto`
   */
  async updatePersonalDetails(updateUserDto: UpdateUserDto, currentUser: User): Promise<{ user: UserResponseDto }> {
    const updatedUser = await this.update(currentUser.id, updateUserDto);
    return { user: new UserResponseDto(updatedUser) };
  }

  /**
   * Inactivates a user by setting status to INACTIVE
   * @param user - User entity to inactivate
   * @returns Updated user entity
   */
  async inactivateUser(user: User): Promise<User> {
    user.status = UserStatus.INACTIVE;
    return await this.saveUser(user);
  }

  /**
   * Increments the business done amount for a user
   * @param user - User entity to increment business done amount
   * @param amount - Amount to increment
   * @returns Updated user entity
   */
  async incrementBusinessDone(user: User, amount: number): Promise<User> {
    user.businessDone = (user.businessDone ?? 0) + amount;
    return await this.saveUser(user);
  }

  /**
   * Increments the direct children count for a user by ID
   * Uses query builder to safely update only this field without affecting relations
   * @param userId - User ID to increment children count for
   * @returns Promise that resolves when update is complete
   */
  async incrementDirectChildrenCount(userId: number): Promise<void> {
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({
        directChildrenCount: () => 'direct_children_count + 1',
      })
      .where('id = :userId', { userId })
      .execute();

    this.logger.log(`Direct children count incremented for user: ${userId}`);
  }

  /**
   * Updates the work role for a user by ID
   * Uses query builder to safely update only this field without affecting relations
   * @param userId - User ID to update work role for
   * @param workRole - New work role value
   * @returns Promise that resolves when update is complete
   */
  async updateWorkRole(userId: number, workRole: WorkRole): Promise<void> {
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ workRole })
      .where('id = :userId', { userId })
      .execute();

    this.logger.log(`Work role updated for user: ${userId} to ${workRole}`);
  }
}
