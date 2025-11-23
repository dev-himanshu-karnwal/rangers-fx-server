import { Exclude, Expose, plainToInstance } from 'class-transformer';
import { WalletType } from '../enums/wallet.enum';
import { Wallet } from '../entities/wallet.entity';

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

  constructor(partial: Partial<WalletResponseDto>) {
    Object.assign(this, partial);
  }

  /**
   * Creates a WalletResponseDto from a Wallet entity
   * @param wallet - Wallet entity to transform
   * @returns WalletResponseDto with only exposed fields
   */
  static fromEntity(wallet: Wallet): WalletResponseDto {
    return plainToInstance(WalletResponseDto, wallet, { excludeExtraneousValues: true });
  }
}
