import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, FindOneOptions, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserResponseDto } from '../dto';
import { ApiResponse } from '../../../common/response/api.response';
import { QueryParamsDto, QueryParamsHelper } from '../../../common/query';
import { LevelsService } from '../../levels/levels.service';

/**
 * User Query Service - handles all user query/find operations
 * Follows Single Responsibility Principle - handles query operations only
 */
@Injectable()
export class UserQueryService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly levelsService: LevelsService,
  ) {}

  /**
   * Find user by ID
   * @param id - User ID
   * @returns User response DTO
   */
  async findOne(id: number): Promise<UserResponseDto> {
    const user = await this.findByIdEntity(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return this.mapToUserResponse(user);
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
    return this.mapToUserResponse(user);
  }

  /**
   * Find user by email
   * @param email - User email
   * @returns User response DTO wrapped in ApiResponse
   */
  async getUserByEmail(email: string): Promise<ApiResponse<{ user: UserResponseDto }>> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return ApiResponse.success('User fetched successfully', {
      user: new UserResponseDto({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      }),
    });
  }

  /**
   * Find user by email (internal use)
   * @param email - User email
   * @param options - Optional find options
   * @returns User entity or null
   */
  async findByEmail(email: string, options?: FindOneOptions<User>): Promise<User | null> {
    return this.userRepository.findOne({ where: { email }, ...options });
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
   * Find User by referredByUserId
   * @param referredByUserId - Referrer user ID
   * @returns User Entity or null
   */
  async findUserByReferredByUserId(referredByUserId: number): Promise<User | null> {
    if (!referredByUserId) {
      return null;
    }
    const user = await this.userRepository.findOne({
      where: { id: Equal(referredByUserId) },
    });
    return user;
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
   * Find all direct children (referrals) of a user by their user ID with pagination, sorting, and filtering.
   * This returns all users whose `referredByUserId` matches the given ID,
   * meaning they were referred directly by that user.
   * @param id - The ID of the parent/referrer user.
   * @param query - Query parameters (pagination, sorting, filters)
   * @returns A list of User entities wrapped in ApiResponse
   */
  async findDirectChildrenOfUserById(
    id: number,
    query: QueryParamsDto,
  ): Promise<
    ApiResponse<{
      meta: {
        total: number;
        page: number;
        limit: number;
      };
      users: UserResponseDto[];
    }>
  > {
    // Parse query parameters
    const parsed = QueryParamsHelper.parse(query);

    // Build query builder for filtering and sorting
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    const metadata = this.userRepository.metadata;

    // Base filter: always filter by referredByUserId
    const referredByUserIdColumn = metadata.findColumnWithPropertyName('referredByUserId');
    queryBuilder.where(`user.${referredByUserIdColumn?.databaseName || 'referred_by_user_id'} = :id`, { id });

    // Apply filters
    const { filters } = parsed;

    // Search filter (searches in fullName and email fields)
    if (filters.search) {
      const fullNameColumn = metadata.findColumnWithPropertyName('fullName');
      const emailColumn = metadata.findColumnWithPropertyName('email');
      queryBuilder.andWhere(
        `(user.${fullNameColumn?.databaseName || 'full_name'} ILIKE :search OR user.${emailColumn?.databaseName || 'email'} ILIKE :search)`,
        { search: `%${filters.search}%` },
      );
    }

    // Status filter
    if (filters.status) {
      const statusColumn = metadata.findColumnWithPropertyName('status');
      queryBuilder.andWhere(`user.${statusColumn?.databaseName || 'status'} = :status`, { status: filters.status });
    }

    // Date range filters
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      const createdAtColumn = metadata.findColumnWithPropertyName('createdAt');
      queryBuilder.andWhere(`user.${createdAtColumn?.databaseName || 'created_at'} >= :startDate`, { startDate });
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      const createdAtColumn = metadata.findColumnWithPropertyName('createdAt');
      queryBuilder.andWhere(`user.${createdAtColumn?.databaseName || 'created_at'} <= :endDate`, { endDate });
    }

    // Apply sorting
    const orderEntries = Object.entries(parsed.order);

    if (orderEntries.length > 0) {
      const [firstField, firstDirection] = orderEntries[0];
      const firstColumn = metadata.findColumnWithPropertyName(firstField);
      if (firstColumn) {
        queryBuilder.orderBy(`user.${firstColumn.databaseName}`, firstDirection);
      } else {
        queryBuilder.orderBy(`user.${firstField}`, firstDirection);
      }

      // Add additional sort fields
      for (let i = 1; i < orderEntries.length; i++) {
        const [field, direction] = orderEntries[i];
        const column = metadata.findColumnWithPropertyName(field);
        if (column) {
          queryBuilder.addOrderBy(`user.${column.databaseName}`, direction);
        } else {
          queryBuilder.addOrderBy(`user.${field}`, direction);
        }
      }
    } else {
      // Default sorting by createdAt DESC
      queryBuilder.orderBy('user.created_at', 'DESC');
    }

    // Apply pagination
    queryBuilder.skip(parsed.skip).take(parsed.take);

    // Execute query
    const [directChildren, total] = await queryBuilder.getManyAndCount();

    const result = QueryParamsHelper.toPaginatedResultWithEntityKey(
      directChildren.map((user) => UserResponseDto.fromEntity(user)),
      total,
      parsed,
      'users',
    );

    return ApiResponse.success('Direct Children fetched Successfully.', result);
  }

  /**
   * Get current user profile
   * @param user - User entity
   * @returns User profile response
   */
  async getMe(user: User): Promise<ApiResponse<{ user: UserResponseDto }>> {
    const userResponse = await this.mapToUserResponse(user);
    return ApiResponse.success('User profile fetched successfully', { user: userResponse });
  }

  private async mapToUserResponse(user: User): Promise<UserResponseDto> {
    const activeLevel = await this.levelsService.getUserCurrentLevel(user.id);
    return UserResponseDto.fromEntity(user, activeLevel?.level ?? null);
  }
}
