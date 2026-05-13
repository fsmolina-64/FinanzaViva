import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { XpSource } from '@prisma/client';

export class AddXpDto {
  @IsInt()
  @Min(1)
  amount!: number;

  @IsEnum(XpSource)
  source!: XpSource;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  description?: string;
}