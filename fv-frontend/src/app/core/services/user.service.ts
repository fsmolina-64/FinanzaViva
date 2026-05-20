import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { UserProfile, UpdateProfileRequest } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(
    private api: ApiService,
    private authService: AuthService
  ) {}

  // Obtiene perfil actualizado desde el backend
  getProfile(): Observable<UserProfile> {
    return this.api.get<UserProfile>('/users/me').pipe(
      tap(user => this.authService.currentUser.set(user))
    );
  }

  // Actualiza perfil y sincroniza el signal global
  updateProfile(data: UpdateProfileRequest): Observable<UserProfile> {
    return this.api.patch<UserProfile>('/users/profile', data).pipe(
      tap(user => this.authService.currentUser.set(user))
    );
  }
}