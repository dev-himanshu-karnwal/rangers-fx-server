import { Exclude, Expose, plainToInstance } from 'class-transformer';
import { BotActivationStatus } from '../enums';
import { BotActivation } from '../entities';
import { UserResponseDto } from '../../user/dto';
import { WalletResponseDto } from '../../wallets/dto';

@Exclude()
export class BotActivationResponseDto {
  @Expose()
  id: number;

  @Expose()
  userId: number;

  @Expose()
  user?: UserResponseDto | null;

  @Expose()
  walletId: number;

  @Expose()
  wallet?: WalletResponseDto | null;

  @Expose()
  status: BotActivationStatus;

  @Expose()
  incomeReceived: number;

  @Expose()
  maxIncome: number;

  @Expose()
  notes?: string | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<BotActivationResponseDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(botActivation: BotActivation): BotActivationResponseDto {
    const dto = plainToInstance(BotActivationResponseDto, botActivation, {
      excludeExtraneousValues: true,
    });

    if (botActivation.user) {
      dto.user = UserResponseDto.fromEntity(botActivation.user);
    }

    if (botActivation.wallet) {
      dto.wallet = WalletResponseDto.fromEntity(botActivation.wallet);
    }

    return dto;
  }
}
