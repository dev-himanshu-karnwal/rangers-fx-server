import { Exclude, Expose, plainToInstance } from 'class-transformer';
import { Level } from '../entities';

@Exclude()
export class LevelResponseDto {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  hierarchy: number;

  @Expose()
  appraisalBonus: number;

  @Expose()
  passiveIncomePercentage: number;

  @Expose()
  conditions: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<LevelResponseDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(level: Level): LevelResponseDto {
    const dto = plainToInstance(LevelResponseDto, level, {
      excludeExtraneousValues: true,
    });
    dto.conditions = JSON.parse(level.conditions);
    return dto;
  }
}
