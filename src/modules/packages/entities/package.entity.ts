import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { IsInt, IsNumber, IsEnum, IsString, Min, Max } from 'class-validator';
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
  title: string;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: false,
    name: 'min_price',
    transformer: decimalTransformer,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(100)
  minPrice: number;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: false,
    name: 'max_price',
    transformer: decimalTransformer,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(20000)
  maxPrice: number;

  @Column({ type: 'int', nullable: false })
  @IsInt()
  @Min(1)
  months: number;

  @Column({
    type: 'enum',
    enum: PackageType,
    nullable: false,
  })
  @IsEnum(PackageType)
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
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  returnPercentage?: number | null; // Only for monthly packages

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    name: 'return_capital',
    transformer: decimalTransformer,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  returnCapital?: number | null; // e.g., 2.0, 2.5, etc.

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
