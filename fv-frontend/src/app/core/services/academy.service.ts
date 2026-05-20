import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  AcademyModule,
  Lesson,
  LessonCompleteResponse
} from '../models/academy.model';

@Injectable({
  providedIn: 'root'
})
export class AcademyService {
  constructor(private api: ApiService) {}

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
    return this.api.post<LessonCompleteResponse>(
      `/academy/lessons/${id}/complete`,
      {}
    );
  }
}