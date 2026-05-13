import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';

@UseGuards(JwtGuard)
@Controller('quizzes')
export class QuizzesController {
  constructor(private quizzesService: QuizzesService) {}

  @Get('module/:moduleId')
  getQuizzesByModule(@Param('moduleId') moduleId: string) {
    return this.quizzesService.getQuizzesByModule(moduleId);
  }

  @Get(':id')
  getQuiz(@Param('id') id: string) {
    return this.quizzesService.getQuiz(id);
  }

  @Post(':id/submit')
  submitQuiz(@Request() req: any, @Param('id') id: string, @Body() dto: SubmitQuizDto) {
    return this.quizzesService.submitQuiz(req.user.id, id, dto);
  }

  @Get(':id/history')
  getHistory(@Request() req: any, @Param('id') id: string) {
    return this.quizzesService.getAttemptHistory(req.user.id, id);
  }
}