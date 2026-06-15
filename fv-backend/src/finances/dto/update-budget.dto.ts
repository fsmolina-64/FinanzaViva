import { IsEnum, IsNumber, IsOptional, Min, ValidateIf, IsDateString } from 'class-validator';
import { BudgetPeriod } from '@prisma/client';

export class UpdateBudgetDto {
    @IsOptional() @IsNumber() @Min(0.01) amount?: number;
    @IsOptional() @IsEnum(BudgetPeriod) period?: BudgetPeriod;
    @IsOptional()
    @ValidateIf(o => o.endDate !== null)
    @IsDateString() endDate?: string | null;
}