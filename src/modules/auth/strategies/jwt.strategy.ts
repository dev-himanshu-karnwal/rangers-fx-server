import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '../../../config/config.service';
import { User } from '../../user/entities/user.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * JWT strategy for passport authentication
 * Validates JWT tokens and extracts user information
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // First, try to extract from cookies
        (request: any) => {
          return request?.cookies?.[configService.authTokenCookieKey] || null;
        },
        // Fallback to Authorization header
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.jwtSecret,
    });
  }

  /**
   * Validate JWT payload and return user
   * Called automatically by passport after token validation
   * The returned user is attached to the request object as request.user
   * @param payload - JWT payload containing only user id
   * @returns User entity
   */
  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: payload.id } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}
