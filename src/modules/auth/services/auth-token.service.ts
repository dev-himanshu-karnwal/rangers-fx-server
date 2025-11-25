import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../user/user.service';
import { User } from '../../user/entities/user.entity';
import { ConfigService } from '../../../config/config.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import type { Response } from 'express';

/**
 * Auth Token Service - handles JWT token operations and cookie management
 * Follows Single Responsibility Principle - handles token operations only
 */
@Injectable()
export class AuthTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate JWT token for user
   * @param user - User entity
   * @returns JWT token string
   */
  generateToken(user: User): string {
    const payload: JwtPayload = {
      id: user.id,
    };

    const expiresIn = this.configService.jwtExpiresIn;
    return this.jwtService.sign(payload, {
      expiresIn,
    } as any);
  }

  /**
   * Validate user for JWT strategy
   * @param userId - User ID
   * @returns User entity
   */
  async validateUser(userId: number): Promise<User> {
    const user = await this.userService.findByIdEntity(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Store value in HTTP-only cookie
   * @param res - Express response object
   * @param key - Cookie key
   * @param value - Cookie value
   */
  storeValueInCookie(res: Response, key: string, value: string): void {
    res.cookie(key, value, {
      httpOnly: true,
      secure: this.configService.isProduction, // Only secure in production (HTTPS required)
      sameSite: this.configService.isProduction ? 'strict' : 'lax', // More flexible in development
      maxAge: this.configService.cookieMaxAge,
      path: '/', // Ensure cookie is available for all paths
    });
  }
}
