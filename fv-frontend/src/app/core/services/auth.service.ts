import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { OnboardingService } from './onboarding.service';
import { LoginRequest, RegisterRequest, AuthResponse, AuthUser } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'fv_token';
  private readonly USER_KEY = 'fv_user';

  isLoggedIn = signal<boolean>(this.hasToken());
  currentUser = signal<AuthUser | null>(this.getSavedUser());

  constructor(
    private api: ApiService,
    private router: Router,
    private onboardingService: OnboardingService
  ) {}

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/login', data).pipe(
      tap(response => this.saveSession(response))
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/register', data);
  }

  refreshProfile(profile: { displayName: string; avatarUrl: string | null }): void {
    this.currentUser.update(prev => prev ? {
      ...prev,
      displayName: profile.displayName ?? prev.displayName,
      avatarUrl: profile.avatarUrl ?? prev.avatarUrl,
    } : prev);
    const saved = this.currentUser();
    if (saved) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(saved));
    }
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
    this.onboardingService.clearAll();
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  private getSavedUser(): AuthUser | null {
    const saved = localStorage.getItem(this.USER_KEY);
    return saved ? JSON.parse(saved) : null;
  }

  private saveSession(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
    this.isLoggedIn.set(true);
    this.currentUser.set(response.user);
    this.onboardingService.clearAll();
  }
}