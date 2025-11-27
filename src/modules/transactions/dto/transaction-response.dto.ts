import { Exclude, Expose, plainToInstance } from 'class-transformer';
import { TransactionStatus, TransactionType } from '../enums/transaction.enum';
import { Transaction } from '../entities/transaction.entity';
import { UserResponseDto } from '../../user/dto';
import { WalletResponseDto } from '../../wallets/dto';

/**
 * DTO for transaction response
 */
@Exclude()
export class TransactionResponseDto {
  @Expose()
  id: number;

  @Expose()
  fromWalletId: number | null;

  @Expose()
  fromWallet: WalletResponseDto | null;

  @Expose()
  toWalletId: number | null;

  @Expose()
  toWallet: WalletResponseDto | null;

  @Expose()
  amount: number;

  @Expose()
  initiatedBy: number;

  @Expose()
  initiator: UserResponseDto;

  @Expose()
  description: string | null;

  @Expose()
  status: TransactionStatus;

  @Expose()
  statusUpdatedAt: Date | null;

  @Expose()
  statusUpdatedBy: number | null;

  @Expose()
  statusUpdater: UserResponseDto | null;

  @Expose()
  type: TransactionType;

  @Expose()
  entityId: number | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<TransactionResponseDto>) {
    Object.assign(this, partial);
  }

  /**
   * Creates a TransactionResponseDto from a Transaction entity
   * @param transaction - Transaction entity to transform
   * @returns TransactionResponseDto with only exposed fields
   */
  static fromEntity(transaction: Transaction): TransactionResponseDto {
    const dto = plainToInstance(TransactionResponseDto, transaction, { excludeExtraneousValues: true });

    // Transform nested wallet relations
    if (transaction.fromWallet) {
      dto.fromWallet = WalletResponseDto.fromEntity(transaction.fromWallet);
    }
    if (transaction.toWallet) {
      dto.toWallet = WalletResponseDto.fromEntity(transaction.toWallet);
    }

    // Transform nested user relations
    if (transaction.initiator) {
      dto.initiator = UserResponseDto.fromEntity(transaction.initiator);
    }
    if (transaction.statusUpdater) {
      dto.statusUpdater = UserResponseDto.fromEntity(transaction.statusUpdater);
    }

    return dto;
  }
}
