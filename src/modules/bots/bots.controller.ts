import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { BotsService } from './bots.service';
import { ActivateBotDto, BotActivationResponseDto } from './dto';
import { User } from '../user/entities';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ApiResponse } from 'src/common/response/api.response';
import { TransactionResponseDto } from '../transactions/dto';
import { QueryParamsDto } from 'src/common/query';
import { QueryValidationPipe } from 'src/common/pipes/query-validation.pipe';
import { PaginatedResult } from 'src/common/pagination/pagination-query.dto';

@Controller('bots')
export class BotsController {
  constructor(private readonly botsService: BotsService) {}

  @Post('activate')
  async activateBot(
    @CurrentUser() user: User,
    @Body() activateBotDto: ActivateBotDto,
  ): Promise<ApiResponse<{ botActivation: BotActivationResponseDto; transactions: TransactionResponseDto[] }>> {
    return this.botsService.activateBot(user, activateBotDto);
  }

  @Get('active')
  async getActiveBot(@CurrentUser() user: User): Promise<ApiResponse<{ botActivation: BotActivationResponseDto }>> {
    return this.botsService.getActiveBot(user);
  }

  @Get('user')
  async getUserBots(
    @CurrentUser() user: User,
    @Query(new QueryValidationPipe()) query: QueryParamsDto,
  ): Promise<ApiResponse<PaginatedResult<BotActivationResponseDto>>> {
    return this.botsService.getUserBots(user, query);
  }
}
