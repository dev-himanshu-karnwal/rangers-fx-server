import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, IsIn, IsString } from 'class-validator';

/**
 * Generic pagination & sorting query DTO.
 * Designed to be extended with additional filters later without rewriting consumers.
 */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;

  @IsOptional()
  @IsString()
  sortBy: string = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc' = 'desc';
}

export interface PaginatedResult<T> {
  meta: {
    total: number;
    page: number;
    limit: number;
  };
  data: T[];
}
