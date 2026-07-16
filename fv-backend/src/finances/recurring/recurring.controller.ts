import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RecurringService } from './recurring.service';
import { CreateRecurringRuleDto, UpdateRecurringRuleDto } from '../dto/create-recurring-rule.dto';
import { RecurringStatus } from '@prisma/client';

@ApiTags('Recurrentes')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('finances/recurring')
export class RecurringController {
  constructor(private recurringService: RecurringService) {}

  @Post()
  @ApiOperation({ summary: 'Crear regla recurrente' })
  create(@Request() req: any, @Body() dto: CreateRecurringRuleDto) {
    return this.recurringService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar reglas recurrentes del usuario' })
  findAll(@Request() req: any) {
    return this.recurringService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una regla recurrente' })
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.recurringService.findOne(req.user.id, id);
  }

  @Get(':id/executions')
  @ApiOperation({ summary: 'Obtener historial de ejecuciones de una regla' })
  getExecutions(@Request() req: any, @Param('id') id: string) {
    return this.recurringService.getExecutions(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar regla recurrente' })
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateRecurringRuleDto) {
    return this.recurringService.update(req.user.id, id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Cambiar estado de la regla (pausar/reanudar/cancelar)' })
  updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body('status') status: RecurringStatus,
  ) {
    return this.recurringService.update(req.user.id, id, { status });
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Ejecutar regla manualmente (para prueba)' })
  executeManually(@Request() req: any, @Param('id') id: string) {
    return this.recurringService.executeNow(req.user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar regla recurrente' })
  remove(@Request() req: any, @Param('id') id: string) {
    return this.recurringService.delete(req.user.id, id);
  }
}