import { Exclude, Expose, plainToInstance } from 'class-transformer';
import { UserPackage } from '../entities/user-package.entity';
import { UserResponseDto } from 'src/modules/user/dto';
import { PackageResponseDto } from './package-response.dto';

@Exclude()
export class UserPackageResponseDto {
  @Expose()
  id: number;

  @Expose()
  userId: number;

  @Expose()
  user?: UserResponseDto | null;

  @Expose()
  packageId: number;

  @Expose()
  package?: PackageResponseDto | null;

  @Expose()
  botId: number;

  @Expose()
  investmentAmount: number;

  @Expose()
  purchaseDate: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<UserPackageResponseDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(userPackage: UserPackage): UserPackageResponseDto {
    const dto = plainToInstance(UserPackageResponseDto, userPackage, {
      excludeExtraneousValues: true,
    });

    if (userPackage.user) {
      dto.user = UserResponseDto.fromEntity(userPackage.user);
    }

    if (userPackage.package) {
      dto.package = PackageResponseDto.fromEntity(userPackage.package);
    }

    return dto;
  }
}
