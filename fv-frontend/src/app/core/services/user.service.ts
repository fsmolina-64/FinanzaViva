import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { UserProfile, UpdateProfileRequest } from '../models/user.model';
import { ChangePasswordRequest } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private api: ApiService) { }

  getProfile(): Observable<UserProfile> {
    return this.api.get<UserProfile>('/users/me');
  }

  updateProfile(data: UpdateProfileRequest): Observable<UserProfile> {
    return this.api.patch<UserProfile>('/users/profile', data);
  }

  deleteAccount(password: string): Observable<{ message: string; deletionScheduledAt: string }> {
    return this.api.delete<{ message: string; deletionScheduledAt: string }>('/users/me', { body: { password } });
  }

  cancelDeletion(): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/users/me/cancel-deletion', {});
  }

  changePassword(data: ChangePasswordRequest): Observable<{ message: string }> {
    return this.api.patch<{ message: string }>('/users/password', data);
  }
}