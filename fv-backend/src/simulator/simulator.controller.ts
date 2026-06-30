import { Controller, Get, Post, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { SimulatorService } from './simulator.service';
import { CreateGameDto } from './dto/create-game.dto';
import { DecideBuyDto } from './dto/decide-buy.dto';
import { DecideOptionDto } from './dto/decide-option.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';

@UseGuards(JwtGuard)
@Controller('simulator')
export class SimulatorController {
  constructor(private readonly simulatorService: SimulatorService) {}

  @Post('games')
  createGame(@Request() req: any, @Body() dto: CreateGameDto) {
    return this.simulatorService.createGame(req.user.id, dto);
  }

  @Post('games/:id/start')
  startGame(@Request() req: any, @Param('id') id: string) {
    return this.simulatorService.startGame(id, req.user.id);
  }

  @Get('games/:id')
  getGameState(@Request() req: any, @Param('id') id: string) {
    return this.simulatorService.getGameState(id, req.user.id);
  }

  @Post('games/:id/roll-dice')
  rollDice(@Request() req: any, @Param('id') id: string) {
    return this.simulatorService.rollDice(id, req.user.id);
  }

  @Post('games/:id/decide-buy')
  decideBuy(@Request() req: any, @Param('id') id: string, @Body() dto: DecideBuyDto) {
    return this.simulatorService.decideBuy(id, req.user.id, dto);
  }

  @Post('games/:id/decide-option')
  decideOption(@Request() req: any, @Param('id') id: string, @Body() dto: DecideOptionDto) {
    return this.simulatorService.decideOption(id, req.user.id, dto);
  }

  @Post('games/:id/dismiss-wildcard')
  dismissWildcard(@Request() req: any, @Param('id') id: string) {
    return this.simulatorService.dismissWildcard(id, req.user.id);
  }

  @Post('games/:id/end-turn')
  endTurn(@Request() req: any, @Param('id') id: string) {
    return this.simulatorService.endTurn(id, req.user.id);
  }

  @Post('games/:id/bot-step')
  botStep(@Request() req: any, @Param('id') id: string) {
    return this.simulatorService.botStep(id, req.user.id);
  }

  @Post('games/:id/abandon')
  abandonGame(@Request() req: any, @Param('id') id: string) {
    return this.simulatorService.abandonGame(id, req.user.id);
  }

  @Get('history')
  getHistory(@Request() req: any) {
    return this.simulatorService.getHistory(req.user.id);
  }

  @Get('board-cells')
  getBoardCells() {
    return this.simulatorService.getBoardCells();
  }
}
