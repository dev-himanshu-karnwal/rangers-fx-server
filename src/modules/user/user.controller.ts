import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Post,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto, UserResponseDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from './entities';
import { ApiResponse } from 'src/common/response/api.response';

/**
 * User controller handling HTTP requests for user operations
 * Follows RESTful conventions
 */
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Get user by ID
   * @param id - User ID
   * @returns User response DTO
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    return this.userService.findOne(id);
  }

  /**
   * Get user by referral code
   * @param referralCode - Referral code
   * @returns User response DTO
   */
  @Get('referral-code/:referralCode')
  @HttpCode(HttpStatus.OK)
  async findOneByReferralCode(@Param('referralCode') referralCode: string): Promise<UserResponseDto> {
    return this.userService.findOneByReferralCode(referralCode);
  }

  /**
   * Get User direct-children
   * @param UserId -  User ID
   * @returns List of user
   */
  @Get(':id/direct-children')
  async getDirectChildernOfUserbyId(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<{ users: UserResponseDto[] }>> {
    return this.userService.findDirectChildrenOfUserById(id);
  }

  /**
   * Update user information
   * @param id - User ID
   * @param updateUserDto - Update data
   * @returns Updated user response DTO
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    return this.userService.update(id, updateUserDto);
  }
}
