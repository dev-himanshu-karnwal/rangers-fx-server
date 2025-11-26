import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Level, UserLevel } from './entities';
import { ApiResponse } from 'src/common/response/api.response';
import { LevelResponseDto } from './dto';
import { User } from '../user/entities/user.entity';

@Injectable()
export class LevelsService {
  constructor(
    @InjectRepository(Level)
    private readonly levelRepository: Repository<Level>,
    @InjectRepository(UserLevel)
    private readonly userLevelRepository: Repository<UserLevel>,
  ) {}

  /**
   * Retrieves all levels.
   */
  async getAll(): Promise<ApiResponse<{ levels: LevelResponseDto[] }>> {
    const levels = await this.levelRepository.find({
      order: { hierarchy: 'ASC' },
    });

    return ApiResponse.success('Levels retrieved successfully', {
      levels: levels.map(LevelResponseDto.fromEntity),
    });
  }

  /**
   * Retrieves a level by id.
   */
  async getById(id: number): Promise<ApiResponse<{ level: LevelResponseDto }>> {
    const level = await this.levelRepository.findOneBy({ id });

    if (!level) {
      throw new NotFoundException('Level not found');
    }

    return ApiResponse.success('Level retrieved successfully', {
      level: LevelResponseDto.fromEntity(level),
    });
  }

  /**
   * Retrieves a level by hierarchy.
   * @param hierarchy - The hierarchy number to look for
   * @returns Level entity if found, otherwise throws NotFoundException
   */
  async getByHierarchy(hierarchy: number): Promise<Level> {
    return this.getLevelEntityByHierarchy(hierarchy);
  }

  /**
   * Assigns a level to a user based on the provided hierarchy.
   * If the user already has the same active level, it reuses it.
   * Otherwise, it closes the previous active level (if any) and creates a new assignment.
   */
  async assignLevelByHierarchy(user: User, hierarchy: number): Promise<UserLevel> {
    const targetLevel = await this.getLevelEntityByHierarchy(hierarchy);

    const activeUserLevel = await this.userLevelRepository.findOne({
      where: { userId: user.id, endDate: IsNull() },
    });

    if (activeUserLevel) {
      if (activeUserLevel.levelId === targetLevel.id) {
        return activeUserLevel;
      }
      activeUserLevel.endDate = new Date();
      await this.userLevelRepository.save(activeUserLevel);
    }

    const userLevel = this.userLevelRepository.create({
      user,
      userId: user.id,
      level: targetLevel,
      levelId: targetLevel.id,
      startDate: new Date(),
      endDate: null,
    });

    return this.userLevelRepository.save(userLevel);
  }

  private async getLevelEntityByHierarchy(hierarchy: number): Promise<Level> {
    const level = await this.levelRepository.findOneBy({ hierarchy });
    if (!level) {
      throw new NotFoundException(`Level with hierarchy ${hierarchy} not found`);
    }
    return level;
  }
}
