import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailTemplateService } from './email-template.service';
import { ConfigModule } from '../../../config/config.module';

/**
 * Email module - provides email services for the application
 * Exports EmailService and EmailTemplateService for use in other modules
 */
@Module({
  imports: [ConfigModule],
  providers: [EmailService, EmailTemplateService],
  exports: [EmailService, EmailTemplateService],
})
export class EmailModule {}
