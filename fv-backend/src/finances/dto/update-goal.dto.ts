import { IsString, IsNumber, IsOptional, IsDateString, IsEnum, Min } from 'class-validator';
import { GoalStatus } from '@prisma/client';

export class UpdateGoalDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    targetAmount?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    currentAmount?: number;

    @IsOptional()
    @IsDateString()
    deadline?: string;

    @IsOptional()
    @IsEnum(GoalStatus)
    status?: GoalStatus;
}