import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Level, UserLevel } from './entities';
import { LevelsService } from './levels.service';
import { LevelsController } from './levels.controller';
import { LevelConditionParserService } from './services/level-condition-parser.service';
import { LevelPromotionService } from './services/level-promotion.service';
import { LevelConditionEvaluatorService } from './services/level-condition-evaluator.service';
import { BusinessConditionEvaluator } from './services/evaluators/business-condition.evaluator';
import { LevelsConditionEvaluator } from './services/evaluators/levels-condition.evaluator';
import { UserModule } from '../user/user.module';
import { ClosureModule } from '../user/closure/closure.module';
import { IncomeModule } from '../income/income.module';
import { User } from '../user/entities/user.entity';
import { UserClosure } from '../user/closure/entities/closure.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Level, UserLevel, User, UserClosure]),
    forwardRef(() => UserModule),
    forwardRef(() => IncomeModule),
    ClosureModule,
  ],
  controllers: [LevelsController],
  providers: [
    LevelsService,
    LevelConditionParserService,
    LevelPromotionService,
    LevelConditionEvaluatorService,
    BusinessConditionEvaluator,
    LevelsConditionEvaluator,
  ],
  exports: [LevelsService, LevelConditionEvaluatorService],
})
export class LevelsModule {}
