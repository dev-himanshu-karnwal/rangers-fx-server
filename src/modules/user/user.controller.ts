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
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ChangeMailDto, EmailVerifyDTO, ChangePasswordDto, UpdateUserDto, UserResponseDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from './entities';
import { ApiResponse } from 'src/common/response/api.response';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';

/**
 * User controller handling HTTP requests for user operations
 * Follows RESTful conventions
 */
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Get user by Email
   * @param email - User Email
   * @returns { user: { id:number, email:string, fullName:string} }
   */
  @Get('email/:email')
  @HttpCode(HttpStatus.OK)
  async getUserByEmail(@Param('email') email: string): Promise<ApiResponse<{ user: UserResponseDto }>> {
    return this.userService.getUserByEmail(email);
  }

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
   * Change current authenticated user's password
   * @param changePasswordDto - DTO containing `oldPassword` and `newPassword`
   * @param user - Current authenticated user (injected by `@CurrentUser`)
   * @returns ApiResponse with success message on successful password change
   */
  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<null>> {
    return this.userService.changePassword(changePasswordDto, user);
  }

  /**
   * Verify the provided mail by sending otp.
   * @param emailVerifyDTO - DTO containing the email
   * @returns ApiResponse with success message indicating OTP was sent
   */
  @Patch('email/verify')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() emailVerifyDTO: EmailVerifyDTO): Promise<ApiResponse<null>> {
    return this.userService.verifyEmail(emailVerifyDTO);
  }

  /**
   * Complete the change email by updating the user's email.
   * @param changeMailDto - DTO containing oldEmail and newEmail
   * @returns ApiResponse containing the updated user DTO
   */
  @Patch('email')
  @HttpCode(HttpStatus.OK)
  async updateEmail(
    @Body() changeMailDto: ChangeMailDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<{ user: UserResponseDto }>> {
    return this.userService.updateEmail(changeMailDto, user);
  }

  /**
   * Update the authenticated user's personal details (non-sensitive fields).
   * @param updateUserDto - Partial user data for personal details update
   * @param user - Current authenticated user (injected by `@CurrentUser`)
   * @returns ApiResponse containing the updated user DTO
   */
  @Patch('personal-details')
  @HttpCode(HttpStatus.OK)
  async updatePersonalDetails(
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: User,
  ): Promise<ApiResponse<{ user: UserResponseDto }>> {
    return this.userService.updatePersonalDetails(updateUserDto, user);
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
    @Query() pagination: PaginationQueryDto,
  ): Promise<ApiResponse<{ total: number; page: number; limit: number; data: UserResponseDto[] }>> {
    return await this.userService.findDirectChildrenOfUserById(id, pagination);
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
}
