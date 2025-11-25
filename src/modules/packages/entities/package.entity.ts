import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { IsInt, IsNumber, IsEnum, IsString, Min, Max, MinLength, MaxLength, IsOptional } from 'class-validator';
import { PackageType } from '../enums';
import { decimalTransformer } from 'src/common/transformers/decimal.transformer';

@Entity('packages')
export class Package {
  @PrimaryGeneratedColumn()
  @IsInt()
  @Min(1)
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  @IsString()
  @MinLength(2, { message: 'Title must be at least 2 characters long' })
  @MaxLength(255, { message: 'Title cannot exceed 255 characters' })
  title: string;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: false,
    name: 'min_price',
    transformer: decimalTransformer,
    default: 100,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(100, { message: 'minPrice must be at least 100' })
  minPrice: number;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: false,
    name: 'max_price',
    transformer: decimalTransformer,
    default: 20000,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(20000, { message: 'maxPrice must be at least 20000' })
  maxPrice: number;

  @Column({ type: 'int', nullable: false })
  @IsInt()
  @Min(1, { message: 'Months must be at least 1' })
  months: number;

  @Column({
    type: 'enum',
    enum: PackageType,
    nullable: false,
  })
  @IsEnum(PackageType, { message: 'Invalid package type' })
  type: PackageType;

  @Column({ type: 'text', nullable: false })
  @IsString()
  features: string; // JSON stringified array

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    name: 'return_percentage',
    transformer: decimalTransformer,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'returnPercentage must have at most 2 decimal places' })
  @Min(0, { message: 'returnPercentage cannot be negative' })
  @Max(100, { message: 'returnPercentage cannot exceed 100' })
  returnPercentage?: number | null; // Only for monthly packages

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: false,
    name: 'return_capital',
    transformer: decimalTransformer,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'returnCapital must have at most 2 decimal places' })
  @Min(0, { message: 'returnCapital cannot be negative' })
  returnCapital?: number | null; // e.g., 2.0, 2.5, etc.

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
