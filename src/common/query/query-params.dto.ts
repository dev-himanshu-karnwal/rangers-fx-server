import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, IsString, IsDateString } from 'class-validator';

/**
 * Generic query parameters DTO for GET all APIs.
 * Handles pagination, sorting, and dynamic filter fields.
 *
 * Usage:
 * - Use this class directly for common filters (status, search, startDate, endDate)
 * - Extend this class to add entity-specific filter fields
 *
 * @example
 * class BotQueryDto extends QueryParamsDto {
 *   @IsOptional()
 *   @IsString()
 *   customField?: string;
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

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

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
