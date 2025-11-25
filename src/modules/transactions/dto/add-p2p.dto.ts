import { IsDefined, IsNotEmpty, IsString, IsNumber, IsOptional, IsPositive, MaxLength, IsInt } from 'class-validator';

/**
 * DTO for adding a p2p transaction
 */
export class AddP2PTransactionDto {
  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  @IsPositive() // amount must be > 0
  amount: number;

  @IsString()
  @IsOptional()
  @MaxLength(1000) // matches DB column length
  description?: string | null;

  @IsDefined()
  @IsNotEmpty()
  @IsInt() // user IDs should always be integers
  toUserId: number;
}
