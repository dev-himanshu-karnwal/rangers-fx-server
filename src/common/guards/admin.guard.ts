import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_ADMIN_KEY } from '../decorators/admin.decorator';
import { UserRole } from '../../modules/user/enums/user.enum';

/**
 * Admin guard to protect routes requiring admin access
 * Extends JWT authentication and checks for ADMIN role
 * Can be used with @Admin() decorator to mark admin-only routes
 */
@Injectable()
export class AdminGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Check if route is marked as admin-only and verify user has ADMIN role
   * @param context - Execution context
   * @returns True if user is authenticated and has ADMIN role
   * @throws ForbiddenException if user is not an admin
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First, ensure JWT authentication passes
    const isAuthenticated = await (super.canActivate(context) as Promise<boolean>);
    if (!isAuthenticated) {
      return false;
    }

    // Check if route is marked as admin-only
    const isAdminRoute = this.reflector.getAllAndOverride<boolean>(IS_ADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Only enforce admin check if route is marked with @Admin()
    if (isAdminRoute) {
      // Get the user from the request (attached by JWT strategy)
      const request = context.switchToHttp().getRequest();
      const user = request.user;

      if (!user) {
        throw new ForbiddenException('User not found');
      }

      // Check if user has ADMIN role
      if (user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Admin access required');
      }
    }

    return true;
  }
}
