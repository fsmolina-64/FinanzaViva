import { IsUUID } from 'class-validator';

export class SubmitDecisionDto {

  @IsUUID()
  chosenOptionId!: string;
}