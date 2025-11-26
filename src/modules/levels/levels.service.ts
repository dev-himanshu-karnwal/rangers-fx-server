import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Level } from './entities';
import { ApiResponse } from 'src/common/response/api.response';
import { LevelResponseDto } from './dto';

@Injectable()
export class LevelsService {
  constructor(
    @InjectRepository(Level)
    private readonly levelRepository: Repository<Level>,
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
    const level = await this.levelRepository.findOneBy({ hierarchy });
    if (!level) {
      throw new NotFoundException(`Level with hierarchy ${hierarchy} not found`);
    }
    return level;
  }
}
