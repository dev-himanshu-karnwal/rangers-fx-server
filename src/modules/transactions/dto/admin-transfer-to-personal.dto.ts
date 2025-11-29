import {
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsBoolean,
  Max,
  MaxLength,
  Min,
  IsInt,
} from 'class-validator';
import { TRANSACTION_CONSTANTS } from '../constants/transaction.constants';

/**
 * DTO for admin transfer from company investment wallet to personal wallet
 */
export class AdminTransferToPersonalDto {
  @IsDefined()
  @IsNotEmpty()
  @IsInt()
  userId: number;

  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(TRANSACTION_CONSTANTS.MAX_AMOUNT)
  @IsPositive()
  amount: number;

  @IsString()
  @IsOptional()
  @MaxLength(1000) // matches DB column length
  description?: string | null;
}
