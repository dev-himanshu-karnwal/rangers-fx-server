import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Package } from './entities';
import { PackageResponseDto } from './dto';
import { ApiResponse } from 'src/common/response/api.response';

@Injectable()
export class PackagesService {
  constructor(
    @InjectRepository(Package)
    private readonly packageRepository: Repository<Package>,
  ) {}

  /**
   * Gets all packages
   */
  async getAll(): Promise<ApiResponse<PackageResponseDto[]>> {
    const packages = await this.packageRepository.find({
      order: {
        id: 'ASC',
      },
    });

    const packageDtos = packages.map((pkg) => PackageResponseDto.fromEntity(pkg));

    return ApiResponse.success('Packages retrieved successfully', packageDtos);
  }

  /**
   * Gets a package by id
   */
  async getById(id: number): Promise<ApiResponse<PackageResponseDto>> {
    const pkg = await this.packageRepository.findOne({
      where: { id },
    });

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    const packageDto = PackageResponseDto.fromEntity(pkg);

    return ApiResponse.success('Package retrieved successfully', packageDto);
  }
}
