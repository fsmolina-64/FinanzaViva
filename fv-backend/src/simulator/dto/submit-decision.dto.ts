import { IsUUID } from 'class-validator';

export class SubmitDecisionDto {
  @IsUUID()
  playerId!: string;

  @IsUUID()
  eventId!: string;

  @IsUUID()
  chosenOptionId!: string;
}