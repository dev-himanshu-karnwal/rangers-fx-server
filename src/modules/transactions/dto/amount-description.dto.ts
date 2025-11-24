import { IsDefined, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
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
  amount: number;

  @IsString()
  @IsOptional()
  description?: string | null;
}
