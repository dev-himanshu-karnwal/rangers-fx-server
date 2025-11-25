import { PaginationQueryDto } from './pagination-query.dto';

/**
 * Helper to convert PaginationQueryDto into TypeORM's skip/take and order options.
 * Framework-agnostic: no entity-specific logic.
 */
export class PaginationHelper {
  static build(query: PaginationQueryDto): { skip: number; take: number; order: Record<string, 'ASC' | 'DESC'> } {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const sortField = query.sortBy || 'createdAt';
    const direction = (query.order || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    return {
      skip,
      take: limit,
      order: { [sortField]: direction },
    };
  }

  static toPaginatedResult<T>(data: T[], total: number, query: PaginationQueryDto) {
    return {
      total,
      page: query.page || 1,
      limit: query.limit || 10,
      data,
    };
  }
}
