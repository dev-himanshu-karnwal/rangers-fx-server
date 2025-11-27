import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Package } from './entities';
import { PackageResponseDto } from './dto';
import { ApiResponse } from '../../common/response/api.response';
import { QueryParamsDto, QueryParamsHelper } from '../../common/query';

@Injectable()
export class PackagesService {
  constructor(
    @InjectRepository(Package)
    private readonly packageRepository: Repository<Package>,
  ) {}

  /**
   * Gets all packages with pagination, sorting, and filtering.
   */
  async getAll(query: QueryParamsDto): Promise<
    ApiResponse<{
      meta: {
        total: number;
        page: number;
        limit: number;
      };
      packages: PackageResponseDto[];
    }>
  > {
    // Parse query parameters
    const parsed = QueryParamsHelper.parse(query);

    // Build query builder for filtering and sorting
    const queryBuilder = this.packageRepository.createQueryBuilder('package');
    const metadata = this.packageRepository.metadata;

    // Apply filters
    const { filters } = parsed;

    // Search filter (searches in title field)
    if (filters.search) {
      const titleColumn = metadata.findColumnWithPropertyName('title');
      queryBuilder.andWhere(`package.${titleColumn?.databaseName || 'title'} ILIKE :search`, {
        search: `%${filters.search}%`,
      });
    }

    // Type filter
    if (filters.type) {
      const typeColumn = metadata.findColumnWithPropertyName('type');
      queryBuilder.andWhere(`package.${typeColumn?.databaseName || 'type'} = :type`, {
        type: filters.type,
      });
    }

    // Date range filters
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      const createdAtColumn = metadata.findColumnWithPropertyName('createdAt');
      queryBuilder.andWhere(`package.${createdAtColumn?.databaseName || 'created_at'} >= :startDate`, { startDate });
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      const createdAtColumn = metadata.findColumnWithPropertyName('createdAt');
      queryBuilder.andWhere(`package.${createdAtColumn?.databaseName || 'created_at'} <= :endDate`, { endDate });
    }

    // Apply sorting
    const orderEntries = Object.entries(parsed.order);

    if (orderEntries.length > 0) {
      const [firstField, firstDirection] = orderEntries[0];
      const firstColumn = metadata.findColumnWithPropertyName(firstField);
      if (firstColumn) {
        queryBuilder.orderBy(`package.${firstColumn.databaseName}`, firstDirection);
      } else {
        queryBuilder.orderBy(`package.${firstField}`, firstDirection);
      }

      // Add additional sort fields
      for (let i = 1; i < orderEntries.length; i++) {
        const [field, direction] = orderEntries[i];
        const column = metadata.findColumnWithPropertyName(field);
        if (column) {
          queryBuilder.addOrderBy(`package.${column.databaseName}`, direction);
        } else {
          queryBuilder.addOrderBy(`package.${field}`, direction);
        }
      }
    } else {
      // Default sorting by createdAt DESC
      queryBuilder.orderBy('package.created_at', 'DESC');
    }

    // Apply pagination
    queryBuilder.skip(parsed.skip).take(parsed.take);

    // Execute query
    const [packages, total] = await queryBuilder.getManyAndCount();

    const result = QueryParamsHelper.toPaginatedResultWithEntityKey(
      packages.map((pkg) => PackageResponseDto.fromEntity(pkg)),
      total,
      parsed,
      'packages',
    );

    return ApiResponse.success('Packages retrieved successfully', result);
  }

  /**
   * Gets a package by id
   */
  async getById(id: number): Promise<ApiResponse<{ package: PackageResponseDto }>> {
    const pkg = await this.packageRepository.findOneBy({ id });

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    return ApiResponse.success('Package retrieved successfully', { package: PackageResponseDto.fromEntity(pkg) });
  }

  /**
   * Gets a package entity by id (for internal use)
   * @param id - Package ID
   * @returns Package entity or null
   */
  async getPackageEntity(id: number): Promise<Package | null> {
    return await this.packageRepository.findOneBy({ id });
  }

  /**
   * Gets a package entity by id or throws if not found
   * @param id - Package ID
   * @returns Package entity
   * @throws NotFoundException if package not found
   */
  async getPackageEntityOrThrow(id: number): Promise<Package> {
    const pkg = await this.getPackageEntity(id);
    if (!pkg) {
      throw new NotFoundException('Package not found');
    }
    return pkg;
  }
}
