import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { ConfigModule } from '../../config/config.module';
import { EmailModule } from '../../core/services/email/email.module';

/**
 * User module - handles user-related operations
 * Exports UserService for use in other modules (e.g., AuthModule)
 */
@Module({
  imports: [TypeOrmModule.forFeature([User]), ConfigModule, EmailModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService], // Export for AuthModule
})
export class UserModule {}
