import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import {
  BackendGame,
  BackendEvent,
  CreateGamePayload,
  SubmitDecisionPayload,
  DecisionResult,
  HistoryEntry
} from '../models/simulator.model';

@Injectable({ providedIn: 'root' })
export class SimulatorService {
  constructor(private api: ApiService) { }

  createGame(payload: CreateGamePayload): Observable<BackendGame> {
    return this.api.post<BackendGame>('/simulator/games', payload);
  }

  startGame(gameId: string): Observable<BackendGame> {
    return this.api.post<BackendGame>(`/simulator/games/${gameId}/start`, {});
  }

  getRandomEvent(): Observable<BackendEvent> {
    return this.api.get<BackendEvent>('/simulator/events/random');
  }

  submitDecision(gameId: string, payload: SubmitDecisionPayload): Observable<DecisionResult> {
    return this.api.post<DecisionResult>(`/simulator/games/${gameId}/decision`, payload);
  }

  nextRound(gameId: string): Observable<BackendGame> {
    return this.api.post<BackendGame>(`/simulator/games/${gameId}/next-round`, {});
  }

  getHistory(): Observable<HistoryEntry[]> {
    return this.api.get<BackendGame[]>('/simulator/history').pipe(
      map(games =>
        games
          .filter(g => g.status === 'FINISHED')
          .map(g => ({
            id: g.id,
            rounds: g.maxRounds,
            finalBalance: Number(g.players?.[0]?.money ?? 0),
            score: g.players?.[0]?.financialScore ?? 0,
            completedAt: g.finishedAt ?? g.createdAt
          }))
      )
    );
  }
}