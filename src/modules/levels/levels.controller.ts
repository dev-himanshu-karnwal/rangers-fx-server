import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { LevelsService } from './levels.service';
import { ApiResponse } from 'src/common/response/api.response';
import { LevelResponseDto } from './dto';

@Controller('levels')
export class LevelsController {
  constructor(private readonly levelsService: LevelsService) {}

  @Get()
  async getLevels(): Promise<ApiResponse<{ levels: LevelResponseDto[] }>> {
    return this.levelsService.getAll();
  }

  @Get(':id')
  async getLevelById(@Param('id', ParseIntPipe) id: number): Promise<ApiResponse<{ level: LevelResponseDto }>> {
    return this.levelsService.getById(id);
  }
}
