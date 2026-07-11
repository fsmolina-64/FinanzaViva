import { IsDateString } from 'class-validator';

export class ExportPdfDto {
  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;
}
