import { Controller, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { JwtGuard } from '../auth/guards/jwt.guard';

@UseGuards(JwtGuard)
@Controller('achievements')
export class AchievementsController {
  constructor(private achievementsService: AchievementsService) {}

  @Get()
  getUserAchievements(@Request() req: any) {
    return this.achievementsService.getUserAchievements(req.user.id);
  }

  @Get('rewards')
  getUserRewards(@Request() req: any) {
    return this.achievementsService.getUserRewards(req.user.id);
  }

  @Patch('rewards/:id/equip')
  equipReward(@Request() req: any, @Param('id') id: string) {
    return this.achievementsService.equipReward(req.user.id, id);
  }
}