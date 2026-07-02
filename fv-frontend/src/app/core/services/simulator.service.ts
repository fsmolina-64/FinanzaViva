import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BackendGame, GameStateResponse, RollDiceResponse,
  DecideBuyResponse, DismissWildcardResponse, DecideOptionResponse, EndTurnResponse,
  CreateGamePayload, HistoryEntry, BoardCell,
} from '../models/simulator.model';

@Injectable({ providedIn: 'root' })
export class SimulatorService {
  private readonly base = `${environment.apiUrl}/simulator`;
  constructor(private http: HttpClient) {}

  createGame(payload: CreateGamePayload): Observable<BackendGame> {
    return this.http.post<BackendGame>(`${this.base}/games`, payload);
  }
  startGame(gameId: string): Observable<GameStateResponse> {
    return this.http.post<GameStateResponse>(`${this.base}/games/${gameId}/start`, {});
  }
  getGameState(gameId: string): Observable<GameStateResponse> {
    return this.http.get<GameStateResponse>(`${this.base}/games/${gameId}`);
  }
  rollDice(gameId: string): Observable<RollDiceResponse> {
    return this.http.post<RollDiceResponse>(`${this.base}/games/${gameId}/roll-dice`, {});
  }
  decideBuy(gameId: string, buy: boolean): Observable<DecideBuyResponse> {
    return this.http.post<DecideBuyResponse>(`${this.base}/games/${gameId}/decide-buy`, { buy });
  }
  dismissWildcard(gameId: string): Observable<DismissWildcardResponse> {
    return this.http.post<DismissWildcardResponse>(`${this.base}/games/${gameId}/dismiss-wildcard`, {});
  }
  decideOption(gameId: string, optionId: string): Observable<DecideOptionResponse> {
    return this.http.post<DecideOptionResponse>(`${this.base}/games/${gameId}/decide-option`, { optionId });
  }
  endTurn(gameId: string): Observable<EndTurnResponse> {
    return this.http.post<EndTurnResponse>(`${this.base}/games/${gameId}/end-turn`, {});
  }
  abandonGame(gameId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/games/${gameId}/abandon`, {});
  }
  getHistory(): Observable<HistoryEntry[]> {
    return this.http.get<HistoryEntry[]>(`${this.base}/history`);
  }
  getBoardCells(): Observable<BoardCell[]> {
    return this.http.get<BoardCell[]>(`${this.base}/board-cells`);
  }
}
