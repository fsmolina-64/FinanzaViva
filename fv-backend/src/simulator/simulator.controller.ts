import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { SimulatorService } from './simulator.service';
import { CreateGameDto } from './dto/create-game.dto';
import { SubmitDecisionDto } from './dto/submit-decision.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';

@UseGuards(JwtGuard)
@Controller('simulator')
export class SimulatorController {
  constructor(private simulatorService: SimulatorService) {}

  @Post('games')
  createGame(@Request() req: any, @Body() dto: CreateGameDto) {
    return this.simulatorService.createGame(req.user.id, dto);
  }

  @Post('games/:id/start')
  startGame(@Request() req: any, @Param('id') id: string) {
    return this.simulatorService.startGame(id, req.user.id);
  }

  @Get('games/:id')
  getGame(@Param('id') id: string) {
    return this.simulatorService.getGame(id);
  }

  @Get('events/random')
  getRandomEvent() {
    return this.simulatorService.getRandomEvent();
  }

  @Post('games/:id/decision')
  submitDecision(@Param('id') id: string, @Body() dto: SubmitDecisionDto) {
    return this.simulatorService.submitDecision(id, dto);
  }

  @Post('games/:id/next-round')
  nextRound(@Request() req: any, @Param('id') id: string) {
    return this.simulatorService.nextRound(id, req.user.id);
  }

  @Get('history')
  getHistory(@Request() req: any) {
    return this.simulatorService.getGameHistory(req.user.id);
  }
}