import { Controller, Get, Param, ParseIntPipe, Post, Body, Query } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { PackageResponseDto, PurchasePackageDto, UserPackageResponseDto } from './dto';
import { ApiResponse } from '../../common/response/api.response';
import { User } from '../user/entities/user.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserPackageService } from './services';
import { QueryParamsDto } from '../../common/query';
import { QueryValidationPipe } from '../../common/pipes/query-validation.pipe';

@Controller('packages')
export class PackagesController {
  constructor(
    private readonly packagesService: PackagesService,
    private readonly userPackageService: UserPackageService,
  ) {}

  @Get()
  async getAll(@Query(new QueryValidationPipe()) query: QueryParamsDto): Promise<
    ApiResponse<{
      meta: {
        total: number;
        page: number;
        limit: number;
      };
      packages: PackageResponseDto[];
    }>
  > {
    return this.packagesService.getAll(query);
  }

  @Get('user')
  async getUserPackages(
    @CurrentUser() user: User,
    @Query(new QueryValidationPipe()) query: QueryParamsDto,
  ): Promise<
    ApiResponse<{
      meta: {
        total: number;
        page: number;
        limit: number;
      };
      userPackages: UserPackageResponseDto[];
    }>
  > {
    return this.userPackageService.getUserPackages(user, query);
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
