import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BackendGame,
  CreateGamePayload,
  SubmitDecisionResponse,
  HistoryEntry
} from '../models/simulator.model';

@Injectable({ providedIn: 'root' })
export class SimulatorService {
  private readonly base = `${environment.apiUrl}/simulator`;

  constructor(private http: HttpClient) { }

  createGame(payload: CreateGamePayload): Observable<BackendGame> {
    return this.http.post<BackendGame>(`${this.base}/games`, payload);
  }


  startGame(gameId: string): Observable<BackendGame> {
    return this.http.post<BackendGame>(`${this.base}/games/${gameId}/start`, {});
  }

  getGameState(gameId: string): Observable<BackendGame> {
    return this.http.get<BackendGame>(`${this.base}/games/${gameId}`);
  }

  submitDecision(gameId: string, chosenOptionId: string): Observable<SubmitDecisionResponse> {
    return this.http.post<SubmitDecisionResponse>(
      `${this.base}/games/${gameId}/decision`,
      { chosenOptionId }
    );
  }

  getHistory(): Observable<HistoryEntry[]> {
    return this.http.get<HistoryEntry[]>(`${this.base}/history`);
  }
}