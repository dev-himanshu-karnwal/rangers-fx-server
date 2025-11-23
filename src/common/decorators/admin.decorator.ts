import { SetMetadata } from '@nestjs/common';

/**
 * Admin decorator to mark routes as admin-only
 * Requires JWT authentication and ADMIN role
 */
export const IS_ADMIN_KEY = 'isAdmin';
export const Admin = () => SetMetadata(IS_ADMIN_KEY, true);
