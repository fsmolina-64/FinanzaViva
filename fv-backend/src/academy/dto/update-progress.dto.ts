import { IsEnum } from 'class-validator';
import { ProgressStatus } from '@prisma/client';

export class UpdateProgressDto {
  @IsEnum(ProgressStatus)
  status!: ProgressStatus;
}