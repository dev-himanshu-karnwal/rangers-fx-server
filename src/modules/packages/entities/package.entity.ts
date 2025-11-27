import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PackageType } from '../enums';
import { decimalTransformer } from '../../../common/transformers/decimal.transformer';

@Entity('packages')
export class Package {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
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
  maxPrice: number;

  @Column({ type: 'int', nullable: false })
  months: number;

  @Column({
    type: 'enum',
    enum: PackageType,
    nullable: false,
  })
  type: PackageType;

  @Column({ type: 'text', nullable: false })
  features: string; // JSON stringified array

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    name: 'return_percentage',
    transformer: decimalTransformer,
  })
  returnPercentage?: number | null; // Only for monthly packages

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: false,
    name: 'return_capital',
    transformer: decimalTransformer,
  })
  returnCapital: number; // e.g., 2.0, 2.5, etc.

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
