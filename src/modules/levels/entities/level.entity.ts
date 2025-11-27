import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { decimalTransformer } from '../../../common/transformers/decimal.transformer';

@Entity('levels')
export class Level {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'int', nullable: false })
  @Index()
  hierarchy: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    name: 'appraisal_bonus',
    transformer: decimalTransformer,
    default: 0,
  })
  appraisalBonus: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: false,
    name: 'passive_income_percentage',
    transformer: decimalTransformer,
  })
  passiveIncomePercentage: number;

  @Column({ type: 'text', nullable: false, name: 'conditions' })
  conditions: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
