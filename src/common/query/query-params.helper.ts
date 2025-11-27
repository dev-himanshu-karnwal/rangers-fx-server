import { QueryParamsDto, ParsedQueryParams } from './query-params.dto';

/**
 * Helper class to parse and transform query parameters into TypeORM-compatible options.
 * Handles pagination, sorting (with multiple fields), and dynamic filters.
 */
export class QueryParamsHelper {
  /**
   * Parses query parameters and returns TypeORM-compatible options.
   *
   * @param query - Query parameters DTO
   * @returns Parsed query parameters with TypeORM options
   *
   * @example
   * const query = { page: 1, pageSize: 10, sort: "incomeReceived:asc,status:asc", status: "active" };
   * const parsed = QueryParamsHelper.parse(query);
   * @returns: { skip: 0, take: 10, order: { incomeReceived: 'ASC', status: 'ASC' }, filters: { status: 'active' } }
   */
  static parse(query: QueryParamsDto): ParsedQueryParams {
    // Set defaults for pagination
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Parse sort string into TypeORM order format
    const order = this.parseSort(query.sort);

    // Extract filter fields (everything except page, pageSize, sort)
    const filters = this.extractFilters(query);

    return {
      page,
      pageSize,
      sort: query.sort || 'createdAt:desc',
      filters,
      order,
      skip,
      take,
    };
  }

  /**
   * Parses a sort string into TypeORM order format.
   * Format: "field1:asc,field2:desc" or "field1:asc"
   * Default: "createdAt:desc" if not provided
   *
   * @param sortString - Sort string in format "field:direction,field2:direction"
   * @returns TypeORM order object
   *
   * @example
   * parseSort("incomeReceived:asc,status:asc")
   * // Returns: { incomeReceived: 'ASC', status: 'ASC' }
   *
   * parseSort("createdAt:desc")
   * // Returns: { createdAt: 'DESC' }
   *
   * parseSort(null)
   * // Returns: { createdAt: 'DESC' }
   */
  static parseSort(sortString?: string): Record<string, 'ASC' | 'DESC'> {
    // Default sort
    if (!sortString || sortString.trim() === '') {
      return { createdAt: 'DESC' };
    }

    const order: Record<string, 'ASC' | 'DESC'> = {};
    const sortPairs = sortString.split(',').map((pair) => pair.trim());

    for (const pair of sortPairs) {
      const [field, direction] = pair.split(':').map((s) => s.trim());

      if (!field) continue;

      // Normalize direction to ASC or DESC
      const normalizedDirection = direction?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
      order[field] = normalizedDirection;
    }

    // If no valid sort pairs were found, use default
    if (Object.keys(order).length === 0) {
      return { createdAt: 'DESC' };
    }

    return order;
  }

  /**
   * Extracts filter fields from query, excluding pagination and sort fields.
   *
   * @param query - Query parameters DTO
   * @returns Object containing only filter fields
   */
  static extractFilters(query: QueryParamsDto): Record<string, any> {
    const filters: Record<string, any> = {};
    const excludedFields = ['page', 'pageSize', 'sort'];

    for (const key in query) {
      if (query.hasOwnProperty(key) && !excludedFields.includes(key)) {
        const value = query[key];
        // Only include defined values (not null, not undefined)
        if (value !== null && value !== undefined && value !== '') {
          filters[key] = value;
        }
      }
    }

    return filters;
  }

  /**
   * Builds TypeORM find options from parsed query parameters.
   *
   * @param parsed - Parsed query parameters
   * @param additionalWhere - Additional where conditions to merge with filters
   * @returns TypeORM find options
   */
  static buildFindOptions<T>(
    parsed: ParsedQueryParams,
    additionalWhere?: Partial<T>,
  ): {
    skip: number;
    take: number;
    order: Record<string, 'ASC' | 'DESC'>;
    where: Record<string, any>;
  } {
    return {
      skip: parsed.skip,
      take: parsed.take,
      order: parsed.order,
      where: {
        ...parsed.filters,
        ...additionalWhere,
      },
    };
  }

  /**
   * Creates a paginated response object with entity key inside data.
   * Structure: { meta: {...}, entityKey: [...] }
   * Note: This returns the inner object, not wrapped in 'data', as ApiResponse.success will wrap it.
   *
   * @param data - Array of data items
   * @param total - Total count of items
   * @param parsed - Parsed query parameters
   * @param entityKey - Key name for the entity array (e.g., 'bots', 'levels', 'packages')
   * @returns Object containing meta and entity array (to be wrapped by ApiResponse.success)
   */
  static toPaginatedResultWithEntityKey<T, K extends string>(
    data: T[],
    total: number,
    parsed: ParsedQueryParams,
    entityKey: K,
  ): {
    meta: {
      total: number;
      page: number;
      limit: number;
    };
  } & Record<K, T[]> {
    const meta = {
      total,
      page: parsed.page,
      limit: parsed.pageSize,
    };

    // Construct object using Object.fromEntries for type safety
    const entityEntries: [K, T[]][] = [[entityKey, data]];
    const entityRecord = Object.fromEntries(entityEntries) as Record<K, T[]>;

    return {
      meta,
      ...entityRecord,
    };
  }
}
