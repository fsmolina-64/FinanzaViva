import { Controller, Get, Patch, Delete, Post, Body, UseGuards, Request } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';

@UseGuards(JwtGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) { }

  @Get('me')
  getMe(@Request() req: any) {
    return this.usersService.getMe(req.user.id);
  }

  @Patch('profile')
  updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Patch('onboarding')
  updateOnboarding(@Request() req: any, @Body() dto: UpdateOnboardingDto) {
    return this.usersService.updateOnboarding(req.user.id, dto);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Patch('password')
  changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.id, dto);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Delete('me')
  deleteAccount(@Request() req: any, @Body() dto: DeleteAccountDto) {
    return this.usersService.deleteAccount(req.user.id, dto.password);
  }

  @Post('me/cancel-deletion')
  cancelDeletion(@Request() req: any) {
    return this.usersService.cancelDeletion(req.user.id);
  }
}