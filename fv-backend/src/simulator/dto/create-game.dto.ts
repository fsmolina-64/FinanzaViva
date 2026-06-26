import { IsString, IsOptional, IsEnum, IsInt, Min, Max, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { GameMode, BotPersonality } from '@prisma/client';

export class HumanPlayerDto {
  @IsString()
  displayName!: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

export class BotPlayerDto {
  @IsString()
  displayName!: string;

  @IsEnum(BotPersonality)
  personality!: BotPersonality;
}

export class CreateGameDto {
  @IsEnum(GameMode)
  mode!: GameMode;

  @IsInt()
  @Min(3)
  @Max(10)
  maxRounds!: number;

  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(5000)
  initialMoney?: number;

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
