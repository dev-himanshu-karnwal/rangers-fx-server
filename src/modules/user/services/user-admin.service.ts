import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Wallet } from '../../wallets/entities/wallet.entity';
import { UserLevel } from '../../levels/entities/user-level.entity';
import { AdminUserListDto } from '../dto';
import { ApiResponse } from '../../../common/response/api.response';
import { QueryParamsDto, QueryParamsHelper } from '../../../common/query';
import { WalletType } from '../../wallets/enums/wallet.enum';
import { WalletResponseDto } from '../../wallets/dto';
import { LevelResponseDto } from '../../levels/dto';

/**
 * User Admin Service - handles admin-only user operations
 * Follows Single Responsibility Principle - handles admin query operations only
 */
@Injectable()
export class UserAdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(UserLevel)
    private readonly userLevelRepository: Repository<UserLevel>,
  ) {}

  /**
   * Get all users with pagination, filtering, and sorting (Admin only)
   * Returns users with wallet balance and active level
   * @param query - Query parameters (pagination, sorting, filters)
   * @returns Paginated list of users with wallet and active level
   */
  async getAllUsers(query: QueryParamsDto): Promise<
    ApiResponse<{
      meta: {
        total: number;
        page: number;
        limit: number;
      };
      users: AdminUserListDto[];
    }>
  > {
    // Parse query parameters
    const parsed = QueryParamsHelper.parse(query);

    // Build query builder with joins
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoin('wallets', 'wallet', 'wallet.user_id = user.id AND wallet.wallet_type = :walletType', {
        walletType: WalletType.PERSONAL,
      })
      .leftJoin('user_levels', 'userLevel', 'userLevel.user_id = user.id AND userLevel.end_date IS NULL')
      .leftJoin('levels', 'level', 'level.id = userLevel.level_id');

    const metadata = this.userRepository.metadata;
    const { filters } = parsed;

    // Search filter (searches in fullName, email, and id)
    if (filters.search) {
      const searchTerm = String(filters.search).trim();

      queryBuilder.andWhere(
        `(user.id::text ILIKE :search OR user.full_name ILIKE :search OR user.email ILIKE :search)`,
        { search: `%${searchTerm}%` },
      );
    }

    // Status filter
    if (filters.status) {
      queryBuilder.andWhere(`user.status = :status`, { status: filters.status });
    }

    // Work role filter
    if (filters.workRole) {
      queryBuilder.andWhere(`user.work_role = :workRole`, { workRole: filters.workRole });
    }

    // Role filter
    if (filters.role) {
      queryBuilder.andWhere(`user.role = :role`, { role: filters.role });
    }

    // Level filter
    if (filters.level) {
      queryBuilder.andWhere(`level.id = :levelId`, { levelId: filters.level });
    }

    // Apply sorting - handle special cases for wallet balance and level hierarchy
    const orderEntries = Object.entries(parsed.order);

    if (orderEntries.length > 0) {
      for (let i = 0; i < orderEntries.length; i++) {
        const [field, direction] = orderEntries[i];

        // Handle special sorting fields
        if (field === 'wallet' || field === 'wallet.balance' || field === 'balance') {
          queryBuilder.addOrderBy('wallet.balance', direction);
        } else if (field === 'level' || field === 'level.hierarchy' || field === 'hierarchy') {
          queryBuilder.addOrderBy('level.hierarchy', direction);
        } else {
          // Regular user field sorting
          const column = metadata.findColumnWithPropertyName(field);
          if (column) {
            if (i === 0) {
              queryBuilder.orderBy(`user.${field}`, direction);
            } else {
              queryBuilder.addOrderBy(`user.${field}`, direction);
            }
          } else {
            // Fallback to direct field name
            if (i === 0) {
              queryBuilder.orderBy(`user.${field}`, direction);
            } else {
              queryBuilder.addOrderBy(`user.${field}`, direction);
            }
          }
        }
      }
    } else {
      // Default sorting by createdAt DESC
      queryBuilder.orderBy('user.created_at', 'DESC');
    }

    // Apply pagination
    queryBuilder.skip(parsed.skip).take(parsed.take);

    // Execute query - get raw results to access joined data
    const [users, total] = await queryBuilder.getManyAndCount();

    // Fetch wallets and levels separately for the users (more efficient than N+1)
    const userIds = users.map((u) => u.id);

    let wallets: Wallet[] = [];
    let userLevels: UserLevel[] = [];

    if (userIds.length > 0) {
      wallets = await this.walletRepository.find({
        where: { userId: In(userIds), walletType: WalletType.PERSONAL },
      });

      // Get active levels for all users
      userLevels = await this.userLevelRepository.find({
        where: { userId: In(userIds), endDate: IsNull() },
        relations: ['level'],
      });
    }

    const walletMap = new Map(wallets.map((w) => [w.userId, w]));
    const levelMap = new Map(userLevels.map((ul) => [ul.userId, ul.level]));

    // Map results to AdminUserListDto
    const mappedUsers = users.map((user) => {
      const wallet = walletMap.get(user.id) || null;
      const level = levelMap.get(user.id) || null;

      return new AdminUserListDto({
        id: user.id,
        name: user.fullName,
        email: user.email,
        level: level ? LevelResponseDto.fromEntity(level) : null,
        status: user.status,
        businessDone: user.businessDone,
        workRole: user.workRole,
        role: user.role,
        wallet: wallet ? WalletResponseDto.fromEntity(wallet) : null,
      });
    });

    const result = QueryParamsHelper.toPaginatedResultWithEntityKey(
      mappedUsers,
      total,
      { page: 1, pageSize: 10, sort: 'createdAt:desc', filters: {}, order: { createdAt: 'DESC' }, skip: 0, take: 10 },
      'users',
    );

    return ApiResponse.success('Users fetched successfully', result);
  }
}
