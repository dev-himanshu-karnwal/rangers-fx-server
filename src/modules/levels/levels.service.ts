import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Level, UserLevel } from './entities';
import { ApiResponse } from 'src/common/response/api.response';
import { LevelResponseDto } from './dto';
import { User } from '../user/entities/user.entity';
import { QueryParamsDto, QueryParamsHelper } from 'src/common/query';

@Injectable()
export class LevelsService {
  constructor(
    @InjectRepository(Level)
    private readonly levelRepository: Repository<Level>,
    @InjectRepository(UserLevel)
    private readonly userLevelRepository: Repository<UserLevel>,
  ) {}

  /**
   * Retrieves all levels with pagination, sorting, and filtering for API response.
   */
  async getAll(query: QueryParamsDto): Promise<
    ApiResponse<{
      meta: {
        total: number;
        page: number;
        limit: number;
      };
      levels: LevelResponseDto[];
    }>
  > {
    const { levels, total, parsed } = await this.getAllRaw(query);
    const result = QueryParamsHelper.toPaginatedResultWithEntityKey(
      levels.map((level) => LevelResponseDto.fromEntity(level)),
      total,
      parsed,
      'levels',
    );
    return ApiResponse.success('Levels retrieved successfully', result);
  }

  /**
   * Reusable method to get all levels with filter, sorting, and pagination logic.
   * Returns { levels, total, parsed }
   *
   * NOTE: Default order is by hierarchy ASC (not createdAt).
   */
  async getAllRaw(query: QueryParamsDto): Promise<{
    levels: Level[];
    total: number;
    parsed: ReturnType<typeof QueryParamsHelper.parse>;
  }> {
    // Parse query parameters
    const parsed = QueryParamsHelper.parse(query);

    // Override the default order if not provided by client
    // Remove createdAt from parsed.order if it's only there due to QueryParamsHelper's default
    if (!query?.order || Object.keys(query.order).length === 0) {
      parsed.order = { hierarchy: 'ASC' };
    }

    // Build query builder for filtering and sorting
    const queryBuilder = this.levelRepository.createQueryBuilder('level');
    const metadata = this.levelRepository.metadata;

    // Apply filters
    const { filters } = parsed;

    // Search filter (searches in title field)
    if (filters.search) {
      const titleColumn = metadata.findColumnWithPropertyName('title');
      queryBuilder.andWhere(`level.${titleColumn?.databaseName || 'title'} ILIKE :search`, {
        search: `%${filters.search}%`,
      });
    }

    // Hierarchy filter
    if (filters.hierarchy) {
      const hierarchyColumn = metadata.findColumnWithPropertyName('hierarchy');
      queryBuilder.andWhere(`level.${hierarchyColumn?.databaseName || 'hierarchy'} = :hierarchy`, {
        hierarchy: filters.hierarchy,
      });
    }

    // Date range filters
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      const createdAtColumn = metadata.findColumnWithPropertyName('createdAt');
      queryBuilder.andWhere(`level.${createdAtColumn?.databaseName || 'created_at'} >= :startDate`, { startDate });
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      const createdAtColumn = metadata.findColumnWithPropertyName('createdAt');
      queryBuilder.andWhere(`level.${createdAtColumn?.databaseName || 'created_at'} <= :endDate`, { endDate });
    }

    // Apply sorting
    const orderEntries = Object.entries(parsed.order);

    if (orderEntries.length > 0) {
      const [firstField, firstDirection] = orderEntries[0];
      const firstColumn = metadata.findColumnWithPropertyName(firstField);
      if (firstColumn) {
        queryBuilder.orderBy(`level.${firstColumn.databaseName}`, firstDirection);
      } else {
        queryBuilder.orderBy(`level.${firstField}`, firstDirection);
      }

      // Add additional sort fields
      for (let i = 1; i < orderEntries.length; i++) {
        const [field, direction] = orderEntries[i];
        const column = metadata.findColumnWithPropertyName(field);
        if (column) {
          queryBuilder.addOrderBy(`level.${column.databaseName}`, direction);
        } else {
          queryBuilder.addOrderBy(`level.${field}`, direction);
        }
      }
    } else {
      // (Should not get here as we force default above but keep for safety)
      queryBuilder.orderBy('level.hierarchy', 'ASC');
    }

    // Apply pagination
    queryBuilder.skip(parsed.skip).take(parsed.take);

    // Execute query
    const [levels, total] = await queryBuilder.getManyAndCount();

    return { levels, total, parsed };
  }

  /**
   * Retrieves a level by id.
   */
  async getById(id: number): Promise<ApiResponse<{ level: LevelResponseDto }>> {
    const level = await this.levelRepository.findOneBy({ id });

    if (!level) {
      throw new NotFoundException('Level not found');
    }

    return ApiResponse.success('Level retrieved successfully', {
      level: LevelResponseDto.fromEntity(level),
    });
  }

  /**
   * Retrieves a level by hierarchy.
   * @param hierarchy - The hierarchy number to look for
   * @returns Level entity if found, otherwise throws NotFoundException
   */
  async getByHierarchy(hierarchy: number): Promise<Level> {
    return this.getLevelEntityByHierarchy(hierarchy);
  }

  /**
   * Assigns a level to a user based on the provided hierarchy.
   * If the user already has the same active level, it reuses it.
   * Otherwise, it closes the previous active level (if any) and creates a new assignment.
   */
  async assignLevelByHierarchy(user: User, hierarchy: number): Promise<UserLevel> {
    const targetLevel = await this.getLevelEntityByHierarchy(hierarchy);

    const activeUserLevel = await this.userLevelRepository.findOne({
      where: { userId: user.id, endDate: IsNull() },
    });

    if (activeUserLevel) {
      if (activeUserLevel.levelId === targetLevel.id) {
        return activeUserLevel;
      }
      activeUserLevel.endDate = new Date();
      await this.userLevelRepository.save(activeUserLevel);
    }

    const userLevel = this.userLevelRepository.create({
      user,
      userId: user.id,
      level: targetLevel,
      levelId: targetLevel.id,
      startDate: new Date(),
      endDate: null,
    });

    return this.userLevelRepository.save(userLevel);
  }

  /**
   * Retrieves a level entity by hierarchy.
   * @param hierarchy - The hierarchy number to look for
   * @returns Level entity if found, otherwise throws NotFoundException
   */
  private async getLevelEntityByHierarchy(hierarchy: number): Promise<Level> {
    const level = await this.levelRepository.findOneBy({ hierarchy });
    if (!level) {
      throw new NotFoundException(`Level with hierarchy ${hierarchy} not found`);
    }
    return level;
  }

  /**
   * Retrieves the current level for a user.
   * @param userId - The user ID to look for
   * @returns User level entity if found, otherwise null
   */
  async getUserCurrentLevel(userId: number): Promise<UserLevel | null> {
    return await this.userLevelRepository.findOne({
      where: { userId, endDate: IsNull() },
      relations: ['level'],
    });
  }

  /**
   * Retrieves all levels ordered by hierarchy ascending.
   */
  async getAllLevelsOrdered(): Promise<Level[]> {
    return this.levelRepository.find({
      order: { hierarchy: 'ASC' },
    });
  }

  /**
   * Retrieves active levels (current assignments) for the provided user IDs.
   */
  async getActiveLevelsForUsers(userIds: number[]): Promise<UserLevel[]> {
    if (!userIds.length) {
      return [];
    }

    return this.userLevelRepository.find({
      where: { userId: In(userIds), endDate: IsNull() },
      relations: ['level'],
    });
  }
}
