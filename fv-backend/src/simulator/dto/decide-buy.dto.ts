import { IsBoolean } from 'class-validator';

export class DecideBuyDto {
  @IsBoolean()
  buy!: boolean;
}
