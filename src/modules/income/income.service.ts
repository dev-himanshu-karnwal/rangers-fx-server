import { Injectable } from '@nestjs/common';
import { BotIncomeService } from './services/bot-income.service';
import { PassiveIncomeService } from './services/passive-income.service';
import { TradingIncomeService } from './services/trading-income.service';
import { AppraisalIncomeService } from './services/appraisal-income.service';

/**
 * Income Service - Orchestrator service for all income-related operations
 * Follows Single Responsibility Principle - coordinates income calculations across different income types
 */
@Injectable()
export class IncomeService {
  constructor(
    private readonly botIncomeService: BotIncomeService,
    private readonly passiveIncomeService: PassiveIncomeService,
    private readonly tradingIncomeService: TradingIncomeService,
    private readonly appraisalIncomeService: AppraisalIncomeService,
  ) {}

  /**
   * Gets the bot income service
   * @returns BotIncomeService instance
   */
  getBotIncomeService(): BotIncomeService {
    return this.botIncomeService;
  }

  /**
   * Gets the passive income service
   * @returns PassiveIncomeService instance
   */
  getPassiveIncomeService(): PassiveIncomeService {
    return this.passiveIncomeService;
  }

  /**
   * Gets the trading income service
   * @returns TradingIncomeService instance
   */
  getTradingIncomeService(): TradingIncomeService {
    return this.tradingIncomeService;
  }

  /**
   * Gets the appraisal income service
   * @returns AppraisalIncomeService instance
   */
  getAppraisalIncomeService(): AppraisalIncomeService {
    return this.appraisalIncomeService;
  }
}
