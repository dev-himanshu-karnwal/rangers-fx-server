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
  async getAll(): Promise<ApiResponse<{ packages: PackageResponseDto[] }>> {
    const packages = await this.packageRepository.find();

    return ApiResponse.success('Packages retrieved successfully', {
      packages: packages.map(PackageResponseDto.fromEntity),
    });
  }

  /**
   * Gets a package by id
   */
  async getById(id: number): Promise<ApiResponse<{ package: PackageResponseDto }>> {
    const pkg = await this.packageRepository.findOneBy({ id });

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    return ApiResponse.success('Package retrieved successfully', { package: PackageResponseDto.fromEntity(pkg) });
  }
}
