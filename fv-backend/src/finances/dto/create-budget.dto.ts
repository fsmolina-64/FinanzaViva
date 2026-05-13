import { IsEnum, IsUUID, IsNumber, IsDateString, IsOptional, Min } from 'class-validator';
import { BudgetPeriod } from '@prisma/client';

export class CreateBudgetDto {
  @IsUUID()
  categoryId!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsEnum(BudgetPeriod)
  period!: BudgetPeriod;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}