import { Exclude, Expose, plainToInstance } from 'class-transformer';
import { PackageType } from '../enums';
import { Package } from '../entities';

@Exclude()
export class PackageResponseDto {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  minPrice: number;

  @Expose()
  maxPrice: number;

  @Expose()
  months: number;

  @Expose()
  type: PackageType;

  @Expose()
  features: string[];

  @Expose()
  returnPercentage?: number | null;

  @Expose()
  returnCapital?: number | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<PackageResponseDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(pkg: Package): PackageResponseDto {
    const dto = plainToInstance(PackageResponseDto, pkg, {
      excludeExtraneousValues: true,
    });

    // Parse features from JSON string to array
    try {
      dto.features = JSON.parse(pkg.features);
    } catch {
      dto.features = [];
    }

    return dto;
  }
}
