import { SetMetadata } from '@nestjs/common';

/**
 * Public decorator to mark routes as publicly accessible
 * Bypasses JWT authentication when applied
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
