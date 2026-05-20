import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  SimulatorGame,
  SimulatorGameDetail,
  SimulatorEvent,
  SimulatorDecision,
  SimulatorRoundResult,
  SimulatorHistoryEntry
} from '../models/simulator.model';

@Injectable({
  providedIn: 'root'
})
export class SimulatorService {
  constructor(private api: ApiService) {}

  createGame(): Observable<SimulatorGame> {
    return this.api.post<SimulatorGame>('/simulator/games', {});
  }

  startGame(id: string): Observable<SimulatorGameDetail> {
    return this.api.post<SimulatorGameDetail>(
      `/simulator/games/${id}/start`,
      {}
    );
  }

  getGame(id: string): Observable<SimulatorGameDetail> {
    return this.api.get<SimulatorGameDetail>(`/simulator/games/${id}`);
  }

  getRandomEvent(): Observable<SimulatorEvent> {
    return this.api.get<SimulatorEvent>('/simulator/events/random');
  }

  makeDecision(
    id: string,
    data: SimulatorDecision
  ): Observable<SimulatorRoundResult> {
    return this.api.post<SimulatorRoundResult>(
      `/simulator/games/${id}/decision`,
      data
    );
  }

  nextRound(id: string): Observable<SimulatorGameDetail> {
    return this.api.post<SimulatorGameDetail>(
      `/simulator/games/${id}/next-round`,
      {}
    );
  }

  getHistory(): Observable<SimulatorHistoryEntry[]> {
    return this.api.get<SimulatorHistoryEntry[]>('/simulator/history');
  }
}