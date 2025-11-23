import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserClosureController } from './closure.controller';
import { UserClosureService } from './closure.service';
import { UserClosure } from './entities/closure.entity';

/**
 * Closure module - handles user closure-related operations
 * Exports ClosureService for use in other modules
 */
@Module({
  imports: [TypeOrmModule.forFeature([UserClosure])],
  controllers: [UserClosureController],
  providers: [UserClosureService],
  exports: [UserClosureService], // Export for other modules
})
export class ClosureModule {}
