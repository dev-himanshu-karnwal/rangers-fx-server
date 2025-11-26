import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, IsString } from 'class-validator';

/**
 * Generic query parameters DTO for GET all APIs.
 * Handles pagination, sorting, and dynamic filter fields.
 *
 * Usage:
 * - Extend this class to add specific filter fields for your entity
 * - Or use it directly and access filter fields via index signature
 *
 * @example
 * class BotQueryDto extends QueryParamsDto {
 *   @IsOptional()
 *   @IsString()
 *   status?: string;
 *
 *   @IsOptional()
 *   @IsString()
 *   search?: string;
 * }
 */
export class QueryParamsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  @IsOptional()
  @IsString()
  sort?: string;

  // Index signature to allow any additional filter fields
  [key: string]: any;
}

/**
 * Parsed query parameters with defaults applied
 */
export interface ParsedQueryParams {
  page: number;
  pageSize: number;
  sort: string;
  filters: Record<string, any>;
  order: Record<string, 'ASC' | 'DESC'>;
  skip: number;
  take: number;
}
