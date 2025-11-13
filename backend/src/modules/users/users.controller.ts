import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../../shared/guards/auth.guard';
import { CurrentUser } from '../../shared/decorators/user.decorator';

@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(AuthGuard)
  async getProfile(@CurrentUser() user: any) {
    const profile = await this.usersService.getProfile(user.id);
    return { success: true, data: profile };
  }

  @Put('profile')
  @UseGuards(AuthGuard)
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateProfileDto: {
      fullName: string;
      additionalEmails?: string[];
      additionalPhones?: string[];
      priorityEmail?: string;
      priorityPhone?: string;
    },
  ) {
    const updated = await this.usersService.updateProfile(
      user.id,
      updateProfileDto,
    );
    return { success: true, data: updated };
  }

  @Post('select-role')
  @UseGuards(AuthGuard)
  async selectRole(
    @CurrentUser() user: any,
    @Body() dto: { role: string },
  ) {
    const result = await this.usersService.selectRole(user.id, dto.role);
    return {
      success: true,
      message: 'Role updated successfully',
      data: result,
    };
  }
}
