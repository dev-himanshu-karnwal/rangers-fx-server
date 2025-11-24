import { IsDefined, IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

/**
 * DTO for adding a company transaction
 */
export class AddCompanyTransactionDto {
  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  description?: string | null;
}
