import { IsInt, IsNumber, IsEnum, IsString, Min, Max, MinLength, MaxLength, IsOptional } from 'class-validator';
import { PackageType } from '../enums';

export class PackageDto {
  @IsString()
  @MinLength(2, { message: 'Title must be at least 2 characters long' })
  @MaxLength(255, { message: 'Title cannot exceed 255 characters' })
  title: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(100, { message: 'minPrice must be at least 100' })
  minPrice: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(20000, { message: 'maxPrice must be at least 20000' })
  maxPrice: number;

  @IsInt()
  @Min(1, { message: 'Months must be at least 1' })
  months: number;

  @IsEnum(PackageType, { message: 'Invalid package type' })
  type: PackageType;

  @IsString()
  features: string; // JSON stringified array

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'returnPercentage must have at most 2 decimal places' })
  @Min(0, { message: 'returnPercentage cannot be negative' })
  @Max(100, { message: 'returnPercentage cannot exceed 100' })
  returnPercentage?: number | null;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  returnCapital?: number | null;
}
