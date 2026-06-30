import { IsString } from 'class-validator';

export class DecideOptionDto {
  @IsString()
  optionId!: string;
}
