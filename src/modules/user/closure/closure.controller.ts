import { Controller } from '@nestjs/common';
import { UserClosureService } from './closure.service';

/**
 * Closure controller handling HTTP requests for closure operations
 * Follows RESTful conventions
 */
@Controller('closures')
export class UserClosureController {
  constructor(private readonly userClosureService: UserClosureService) {}
}
