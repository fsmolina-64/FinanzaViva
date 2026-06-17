import {
  IsEnum, IsInt, IsArray, IsString,
  IsOptional, IsUUID, Min, Max, ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { BotPersonality, GameMode } from '@prisma/client';

export class HumanPlayerDto {
  @IsString()
  displayName!: string;

  @IsOptional()
  @IsUUID()
  userId?: string;
}

export class BotPlayerDto {
  @IsString()
  displayName!: string;

  @IsEnum(BotPersonality)
  personality!: BotPersonality;
}

export class CreateGameDto {
  @IsInt()
  @Min(3)
  @Max(10)
  maxRounds!: number;

  @IsEnum(GameMode)
  mode!: GameMode;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HumanPlayerDto)
  humanPlayers!: HumanPlayerDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BotPlayerDto)
  botPlayers?: BotPlayerDto[];

  @IsOptional()
  @IsString()
  xpRecipientId?: string;
}