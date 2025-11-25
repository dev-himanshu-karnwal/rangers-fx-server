import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { PackageResponseDto } from './dto';
import { ApiResponse } from 'src/common/response/api.response';

@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  async getAll(): Promise<ApiResponse<PackageResponseDto[]>> {
    return this.packagesService.getAll();
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number): Promise<ApiResponse<PackageResponseDto>> {
    return this.packagesService.getById(id);
  }
}
