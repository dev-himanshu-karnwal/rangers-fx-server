import { Controller, Get, Param, ParseIntPipe, Post, Body } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { PackageResponseDto, PurchasePackageDto, UserPackageResponseDto } from './dto';
import { ApiResponse } from 'src/common/response/api.response';
import { User } from '../user/entities/user.entity';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserPackageService } from './services';

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
