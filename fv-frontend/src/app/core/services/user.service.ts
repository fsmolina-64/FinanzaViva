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

  deleteAccount(): Observable<void> {
    return this.api.delete<void>('/users/me');
  }
  changePassword(data: ChangePasswordRequest): Observable<{ message: string }> {
    return this.api.patch<{ message: string }>('/users/password', data);
  }
}