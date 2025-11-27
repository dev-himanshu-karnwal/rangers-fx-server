import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { LevelsService } from './levels.service';
import { ApiResponse } from '../../common/response/api.response';
import { LevelResponseDto } from './dto';
import { QueryParamsDto } from '../../common/query';
import { QueryValidationPipe } from '../../common/pipes/query-validation.pipe';

@Controller('levels')
export class LevelsController {
  constructor(private readonly levelsService: LevelsService) {}

  @Get()
  async getLevels(@Query(new QueryValidationPipe()) query: QueryParamsDto): Promise<
    ApiResponse<{
      meta: {
        total: number;
        page: number;
        limit: number;
      };
      levels: LevelResponseDto[];
    }>
  > {
    return this.levelsService.getAll(query);
  }

  @Get(':id')
  async getLevelById(@Param('id', ParseIntPipe) id: number): Promise<ApiResponse<{ level: LevelResponseDto }>> {
    return this.levelsService.getById(id);
  }
}
