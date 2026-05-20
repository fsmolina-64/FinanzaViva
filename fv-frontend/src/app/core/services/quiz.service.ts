import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Quiz,
  QuizSubmitRequest,
  QuizSubmitResponse,
  QuizHistoryEntry
} from '../models/quiz.model';

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  constructor(private api: ApiService) {}

  getQuizByModule(moduleId: string): Observable<Quiz> {
    return this.api.get<Quiz>(`/quizzes/module/${moduleId}`);
  }

  getQuiz(id: string): Observable<Quiz> {
    return this.api.get<Quiz>(`/quizzes/${id}`);
  }

  submitQuiz(id: string, data: QuizSubmitRequest): Observable<QuizSubmitResponse> {
    return this.api.post<QuizSubmitResponse>(`/quizzes/${id}/submit`, data);
  }

  getHistory(id: string): Observable<QuizHistoryEntry[]> {
    return this.api.get<QuizHistoryEntry[]>(`/quizzes/${id}/history`);
  }
}