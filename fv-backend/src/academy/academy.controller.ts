import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { AcademyService } from './academy.service';
import { JwtGuard } from '../auth/guards/jwt.guard';

@UseGuards(JwtGuard)
@Controller('academy')
export class AcademyController {
  constructor(private academyService: AcademyService) {}

  @Get('modules')
  getModules(@Request() req: any) {
    return this.academyService.getModules(req.user.id);
  }

  @Get('modules/:id')
  getModule(@Request() req: any, @Param('id') id: string) {
    return this.academyService.getModule(req.user.id, id);
  }

  @Get('lessons/:id')
  getLesson(@Request() req: any, @Param('id') id: string) {
    return this.academyService.getLesson(req.user.id, id);
  }

  @Post('lessons/:id/complete')
  completeLesson(@Request() req: any, @Param('id') id: string) {
    return this.academyService.completeLesson(req.user.id, id);
  }
}