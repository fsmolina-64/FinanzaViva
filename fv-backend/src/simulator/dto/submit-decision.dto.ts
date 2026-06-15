import { IsUUID } from 'class-validator';

export class SubmitDecisionDto {
  // El backend sabe quién es el jugador activo (game.currentPlayerId)
  // y qué evento le fue asignado (player.currentEventId)
  // Solo necesitamos la opción elegida
  @IsUUID()
  chosenOptionId!: string;
}