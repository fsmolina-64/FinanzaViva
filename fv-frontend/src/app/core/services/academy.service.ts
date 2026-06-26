import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  AcademyModule,
  Lesson,
  LessonCompleteResponse,
  LessonResetResponse,
} from '../models/academy.model';

@Injectable({
  providedIn: 'root'
})
export class AcademyService {
  constructor(private api: ApiService) { }

  getModules(): Observable<AcademyModule[]> {
    return this.api.get<AcademyModule[]>('/academy/modules');
  }

  getModule(id: string): Observable<AcademyModule> {
    return this.api.get<AcademyModule>(`/academy/modules/${id}`);
  }

  getLesson(id: string): Observable<Lesson> {
    return this.api.get<Lesson>(`/academy/lessons/${id}`);
  }

  completeLesson(id: string): Observable<LessonCompleteResponse> {
    return this.api.post<LessonCompleteResponse>(`/academy/lessons/${id}/complete`, {});
  }

  resetLesson(id: string): Observable<LessonResetResponse> {
    return this.api.post<LessonResetResponse>(`/academy/lessons/${id}/reset`, {});
  }

  getReadingProgress(moduleId: string): Observable<{ readingProgress: number }> {
    return this.api.get<{ readingProgress: number }>(`/academy/modules/${moduleId}/reading-progress`);
  }
}
