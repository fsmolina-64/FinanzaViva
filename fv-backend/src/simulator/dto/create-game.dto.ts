import {
  IsEnum, IsInt, IsArray, IsString,
  IsOptional, IsUUID, Min, Max, ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
// Requiere migración ejecutada para que Prisma genere estos tipos
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

  // Al menos 1 humano en modo MULTIPLAYER/SOLO/MIXED
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HumanPlayerDto)
  humanPlayers!: HumanPlayerDto[];

  // Requerido en SOLO, SIMULATION y MIXED
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BotPlayerDto)
  botPlayers?: BotPlayerDto[];

  // userId que recibirá la XP al terminar la partida
  @IsOptional()
  @IsString()
  xpRecipientId?: string;
}