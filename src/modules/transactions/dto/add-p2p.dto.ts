import { IsDefined, IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

/**
 * DTO for adding a p2p transaction
 */
export class AddP2PTransactionDto {
  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  toUserId: number;
}
