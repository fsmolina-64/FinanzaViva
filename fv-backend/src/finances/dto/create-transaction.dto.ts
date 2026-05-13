import { IsEnum, IsString, IsOptional, IsDateString, IsUUID } from 'class-validator';
import { IsNumber, Min } from 'class-validator';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @IsUUID()
  accountId!: string;

  @IsUUID()
  categoryId!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsEnum(TransactionType)
  type!: TransactionType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  date!: string;
}