import { IsOptional, IsString, IsDateString } from 'class-validator';

/**
 * Query parameters DTO for wallet summary API.
 * Only includes filters, no pagination or sorting.
 */
export class WalletSummaryQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  direction?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  // Index signature to allow any additional filter fields
  [key: string]: any;
}
