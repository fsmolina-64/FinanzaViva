import { IsString, IsNumber, IsOptional, IsDateString, IsEnum, IsUUID, Min } from 'class-validator';
import { GoalStatus } from '@prisma/client';

export class UpdateGoalDto {
    @IsOptional() @IsString() name?: string;
    @IsOptional() @IsNumber() @Min(0.01) targetAmount?: number;
    @IsOptional() @IsNumber() @Min(0.01) currentAmount?: number;
    @IsOptional() @IsDateString() deadline?: string;
    @IsOptional() @IsEnum(GoalStatus) status?: GoalStatus;
    @IsOptional() @IsUUID() fromAccountId?: string;
}