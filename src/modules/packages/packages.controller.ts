import { Controller, Get, Param, ParseIntPipe, Post, Body, ParseEnumPipe, Query } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { PackageResponseDto, PurchasePackageDto, UserPackageResponseDto } from './dto';
import { ApiResponse } from 'src/common/response/api.response';
import { User } from '../user/entities/user.entity';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserPackageService } from './services';
import { UserPackageStatus } from './enums';

@Controller('packages')
export class PackagesController {
  constructor(
    private readonly packagesService: PackagesService,
    private readonly userPackageService: UserPackageService,
  ) {}

  @Get()
  async getAll(): Promise<ApiResponse<{ packages: PackageResponseDto[] }>> {
    return this.packagesService.getAll();
  }

  @Get('user')
  async getUserPackages(
    @CurrentUser() user: User,
    @Query('status', new ParseEnumPipe(UserPackageStatus, { optional: true })) status: UserPackageStatus | undefined,
  ): Promise<ApiResponse<{ userPackages: UserPackageResponseDto[] }>> {
    return this.userPackageService.getUserPackages(user, status);
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number): Promise<ApiResponse<{ package: PackageResponseDto }>> {
    return this.packagesService.getById(id);
  }

  @Post()
  async purchasePackage(
    @CurrentUser() user: User,
    @Body() purchasePackageDto: PurchasePackageDto,
  ): Promise<ApiResponse<{ userPackage: UserPackageResponseDto }>> {
    return this.userPackageService.purchasePackage(user, purchasePackageDto);
  }
}
