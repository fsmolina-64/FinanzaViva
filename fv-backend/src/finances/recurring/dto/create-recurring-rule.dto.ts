import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecurringFrequency, TransactionType } from '@prisma/client';

export class CreateRecurringRuleDto {
  @ApiProperty({ example: 'uuid-cuenta' })
  @IsString()
  accountId: string;

  @ApiPropertyOptional({ example: 'uuid-categoria' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ example: 50.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: TransactionType, example: 'EXPENSE' })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiPropertyOptional({ example: 'Suscripción mensual Netflix' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: RecurringFrequency, example: 'MONTHLY' })
  @IsEnum(RecurringFrequency)
  frequency: RecurringFrequency;

  @ApiPropertyOptional({ example: 1, description: 'Cada cuántos períodos' })
  @IsOptional()
  @IsInt()
  @Min(1)
  interval?: number;

  @ApiPropertyOptional({ example: 15, description: 'Día del mes para mensual (1-31)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @ApiPropertyOptional({ example: 1, description: 'Día de la semana para semanal (0=Domingo, 6=Sábado)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 12, description: 'Máximo número de ejecuciones' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxOccurrences?: number;
}

export class UpdateRecurringRuleDto {
  @ApiPropertyOptional({ example: 'uuid-cuenta' })
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiPropertyOptional({ example: 'uuid-categoria' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: 75.00 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({ enum: TransactionType })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({ example: 'Suscripción actualizada' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: RecurringFrequency })
  @IsOptional()
  @IsEnum(RecurringFrequency)
  frequency?: RecurringFrequency;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  interval?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @ApiPropertyOptional({ example: '2024-02-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxOccurrences?: number;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'] })
  @IsOptional()
  @IsString()
  status?: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
}