import { Exclude, Expose } from 'class-transformer';
import { UserResponseDto } from '../../user/dto/user-response.dto';

/**
 * DTO for authentication response (includes token and user info)
 */
@Exclude()
export class AuthResponseDto {
  @Expose()
  accessToken: string;

  @Expose()
  user: UserResponseDto;

  constructor(partial: Partial<AuthResponseDto>) {
    Object.assign(this, partial);
  }
}
