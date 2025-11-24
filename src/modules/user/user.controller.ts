import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ChangeMailDto, ChangePasswordDto, UpdateUserDto, UserResponseDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from './entities';
import { ApiResponse } from 'src/common/response/api.response';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';

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
  @Public()
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
  @HttpCode(HttpStatus.OK)
  async getDirectChildernOfUserbyId(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<{ users: UserResponseDto[] }>> {
    return await this.userService.findDirectChildrenOfUserById(id);
  }

  /**
   * Update user information
   * @param id - User ID
   * @param updateUserDto - Update data
   * @returns Updated user response DTO
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    return this.userService.update(id, updateUserDto);
  }

  /**
   * Change current authenticated user's password
   * @param changePasswordDto - DTO containing `oldPassword` and `newPassword`
   * @param user - Current authenticated user (injected by `@CurrentUser`)
   * @returns ApiResponse with success message on successful password change
   */
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<null>> {
    return this.userService.changePassword(changePasswordDto, user);
  }

  /**
   * Initiate change email flow by sending an OTP to the current (old) email.
   * @param oldMail - DTO containing the current/old email (and optionally new email)
   * @returns ApiResponse with success message indicating OTP was sent
   */
  @Post('change-email/sent-otp')
  @HttpCode(HttpStatus.OK)
  async changeEmail(@Body() oldMail: ChangeMailDto): Promise<ApiResponse<null>> {
    return this.userService.changeEmail(oldMail);
  }

  /**
   * Complete the change email flow by verifying OTP and updating the user's email.
   * @param changeMailDto - DTO containing oldEmail, newEmail and OTP (as applicable)
   * @returns ApiResponse containing the updated user DTO
   */
  @Post('change-email/complete')
  @HttpCode(HttpStatus.OK)
  async completeChangeEmail(@Body() changeMailDto: ChangeMailDto): Promise<ApiResponse<{ user: UserResponseDto }>> {
    return this.userService.completeChangeEmail(changeMailDto);
  }
}
