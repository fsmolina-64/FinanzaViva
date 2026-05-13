import { IsEnum, IsInt, IsArray, IsString, IsOptional, IsUUID, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RoundType } from '@prisma/client';

export class PlayerDto {
  @IsString()
  displayName!: string;

  @IsOptional()
  @IsUUID()
  userId?: string;
}

export class CreateGameDto {
  @IsInt()
  @Min(1)
  @Max(12)
  maxRounds!: number;

  @IsEnum(RoundType)
  roundType!: RoundType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerDto)
  players!: PlayerDto[];
}