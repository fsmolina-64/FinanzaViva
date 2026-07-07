import { IsString, IsOptional, IsUrl, ValidateIf, MinLength, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  displayName?: string;

  @IsOptional()
  @ValidateIf((o) => o.avatarUrl !== '')
  @IsUrl({}, { message: 'URL de avatar inválida' })
  @MaxLength(500)
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280, { message: 'Máximo 280 caracteres' })
  bio?: string;
}