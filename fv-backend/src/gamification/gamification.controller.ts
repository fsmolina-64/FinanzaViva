import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { AddXpDto } from './dto/add-xp.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';

@UseGuards(JwtGuard)
@Controller('gamification')
export class GamificationController {
  constructor(private gamificationService: GamificationService) { }

  @Get('stats')
  getStats(@Request() req: any) {
    return this.gamificationService.getStats(req.user.id);
  }

  @Post('xp')
  addXp(@Request() req: any, @Body() dto: AddXpDto) {
    return this.gamificationService.addXp(req.user.id, dto);
  }

  @Post('streak')
  updateStreak(@Request() req: any) {
    return this.gamificationService.updateStreak(req.user.id);
  }

  @Get('streak/history')
  getStreakHistory(
    @Request() req: any,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const m = parseInt(month, 10) || new Date().getMonth() + 1;
    const y = parseInt(year, 10) || new Date().getFullYear();
    return this.gamificationService.getStreakHistory(req.user.id, m, y);
  }
}