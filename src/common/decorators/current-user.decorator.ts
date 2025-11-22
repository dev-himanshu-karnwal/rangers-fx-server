import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../modules/user/entities/user.entity';

/**
 * CurrentUser decorator to extract the authenticated user from the request
 * The user is automatically attached to the request by the JWT strategy
 *
 * Usage:
 * @Get('profile')
 * async getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext): User => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
