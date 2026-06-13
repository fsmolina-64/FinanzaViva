import { IsEnum, IsString, IsOptional, IsDateString, IsUUID, IsNumber, Min } from 'class-validator';
import { TransactionType } from '@prisma/client';

export class UpdateTransactionDto {
    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @IsOptional()
    @IsNumber()
    @Min(0.01)
    amount?: number;

    @IsOptional()
    @IsEnum(TransactionType)
    type?: TransactionType;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsDateString()
    date?: string;
}