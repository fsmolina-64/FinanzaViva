import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { JwtGuard } from '../auth/guards/jwt.guard';

@UseGuards(JwtGuard)
@Controller('ranking')
export class RankingController {
  constructor(private rankingService: RankingService) {}

  @Get()
  async getRanking(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit ?? '10', 10) || 10));
    return this.rankingService.getRanking(p, l);
  }

  @Get('user/:id')
  async getUserRanking(@Param('id') id: string) {
    return this.rankingService.getUserRanking(id);
  }

  @Post('update')
  async updateRanking() {
    return this.rankingService.updateRanking();
  }
}
