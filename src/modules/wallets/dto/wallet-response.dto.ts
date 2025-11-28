import { Exclude, Expose, plainToInstance } from 'class-transformer';
import { WalletType } from '../enums/wallet.enum';
import { Wallet } from '../entities/wallet.entity';
import { User } from '../../user/entities/user.entity';

/**
 * DTO for wallet response
 */
@Exclude()
export class WalletResponseDto {
  @Expose()
  id: number;

  @Expose()
  userId: number | null;

  @Expose()
  balance: number;

  @Expose()
  walletType: WalletType;

  @Expose()
  currency: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  user?: WalletUserSummaryDto | null;

  constructor(partial: Partial<WalletResponseDto>) {
    Object.assign(this, partial);
  }

  /**
   * Creates a WalletResponseDto from a Wallet entity
   * @param wallet - Wallet entity to transform
   * @returns WalletResponseDto with only exposed fields
   */
  static fromEntity(wallet: Wallet): WalletResponseDto {
    const dto = plainToInstance(WalletResponseDto, wallet, { excludeExtraneousValues: true });
    if (wallet.user) {
      dto.user = plainToInstance(WalletUserSummaryDto, wallet.user, { excludeExtraneousValues: true });
    } else {
      dto.user = null;
    }
    return dto;
  }
}

@Exclude()
export class WalletUserSummaryDto extends User {
  @Expose()
  declare id: number;

  @Expose()
  declare fullName: string;
}
