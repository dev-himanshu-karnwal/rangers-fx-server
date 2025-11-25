import { IsInt, IsNumber, Min } from 'class-validator';

export class PurchasePackageDto {
  @IsInt()
  packageId: number;

  @IsNumber()
  @Min(0.01)
  investmentAmount: number;
}
