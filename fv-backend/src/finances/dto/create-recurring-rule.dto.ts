import { IsEnum, IsUUID, IsNumber, IsDateString, IsOptional, Min, Max, IsString, IsInt } from 'class-validator';
import { TransactionType } from '@prisma/client';
import { RecurringFrequency, RecurringStatus } from '@prisma/client';

export class CreateRecurringRuleDto {
  @IsUUID()
  accountId!: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsEnum(TransactionType)
  type!: TransactionType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(RecurringFrequency)
  frequency!: RecurringFrequency;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  interval?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxOccurrences?: number;
}

export class UpdateRecurringRuleDto {
  @IsOptional()
  @IsUUID()
  accountId?: string;

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
  @IsEnum(RecurringFrequency)
  frequency?: RecurringFrequency;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  interval?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxOccurrences?: number;

  @IsOptional()
  @IsEnum(RecurringStatus)
  status?: RecurringStatus;
}