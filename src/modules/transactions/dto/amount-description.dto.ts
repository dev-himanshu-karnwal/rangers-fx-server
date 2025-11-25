import {
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  isPositive,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { TRANSACTION_CONSTANTS } from '../constants/transaction.constants';

/**
 * Base DTO encapsulating an amount and optional description payload.
 */
export class AmountDescriptionDto {
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
