import { Exclude, Expose } from 'class-transformer';
import { UserStatus, UserRole, WorkRole } from '../enums/user.enum';
import { LevelResponseDto } from '../../levels/dto';
import { WalletResponseDto } from '../../wallets/dto';

/**
 * DTO for admin user list response
 * Contains user info with wallet and activeLevel as objects
 */
@Exclude()
export class AdminUserListDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  level: LevelResponseDto | null; // activeLevel

  @Expose()
  status: UserStatus;

  @Expose()
  businessDone: number | null;

  @Expose()
  workRole: WorkRole;

  @Expose()
  role: UserRole;

  @Expose()
  wallet: WalletResponseDto | null;

  constructor(partial: Partial<AdminUserListDto>) {
    Object.assign(this, partial);
  }
}
