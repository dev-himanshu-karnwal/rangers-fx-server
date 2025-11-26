import { Body, Controller, Get, Post } from '@nestjs/common';
import { BotsService } from './bots.service';
import { ActivateBotDto, BotActivationResponseDto } from './dto';
import { User } from '../user/entities';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ApiResponse } from 'src/common/response/api.response';
import { TransactionResponseDto } from '../transactions/dto';

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
}
