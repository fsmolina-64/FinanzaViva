import { IsEnum, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';
import { BudgetPeriod } from '@prisma/client';

export class UpdateBudgetDto {
    @IsOptional()
    @IsNumber()
    @Min(0.01)
    amount?: number;

    @IsOptional()
    @IsEnum(BudgetPeriod)
    period?: BudgetPeriod;

    @IsOptional()
    @IsDateString()
    endDate?: string;
}