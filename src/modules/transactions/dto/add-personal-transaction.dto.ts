import { IsDefined, IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

/**
 * DTO for adding a user transaction
 */
export class AddPersonalTransactionDto {
  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  description?: string | null;
}
