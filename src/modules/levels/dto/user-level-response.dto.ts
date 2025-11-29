import { Exclude, Expose, plainToInstance } from 'class-transformer';
import { UserLevel } from '../entities';
import { LevelResponseDto } from './level-response.dto';

@Exclude()
export class UserLevelResponseDto {
  @Expose()
  id: number;

  @Expose()
  level: LevelResponseDto;

  @Expose()
  startDate: Date;

  @Expose()
  endDate: Date | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<UserLevelResponseDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(userLevel: UserLevel): UserLevelResponseDto {
    const dto = plainToInstance(UserLevelResponseDto, userLevel, {
      excludeExtraneousValues: true,
    });
    dto.level = LevelResponseDto.fromEntity(userLevel.level);
    return dto;
  }
}
