import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

export interface User {
  email: string;
  password: string;
  name: string;
  createdAt: string;
}

export interface Session {
  email: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly USERS_KEY = 'fv_users';
  private readonly SESSION_KEY = 'fv_session';
  private router = inject(Router);

  session = signal<Session | null>(this.loadSession());

  isLoggedIn = computed(() => this.session() !== null);
  currentUser = computed(() => this.session());

  private loadSession(): Session | null {
    try {
      const raw = localStorage.getItem(this.SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  private getUsers(): User[] {
    try {
      return JSON.parse(localStorage.getItem(this.USERS_KEY) ?? '[]');
    } catch { return []; }
  }

  private saveUsers(users: User[]) {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  register(name: string, email: string, password: string): { ok: boolean; error?: string } {
    const users = this.getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: 'El correo ya está registrado.' };
    }
    const newUser: User = { email: email.toLowerCase(), password, name, createdAt: new Date().toISOString() };
    users.push(newUser);
    this.saveUsers(users);
    this.startSession({ email: newUser.email, name: newUser.name });
    return { ok: true };
  }

  login(email: string, password: string): { ok: boolean; error?: string } {
    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) return { ok: false, error: 'Correo o contraseña incorrectos.' };
    this.startSession({ email: user.email, name: user.name });
    return { ok: true };
  }

  logout() {
    localStorage.removeItem(this.SESSION_KEY);
    this.session.set(null);
    this.router.navigate(['/auth']);
  }

  updateName(newName: string) {
    const sess = this.session();
    if (!sess) return;
    const users = this.getUsers();
    const idx = users.findIndex(u => u.email === sess.email);
    if (idx >= 0) {
      users[idx].name = newName;
      this.saveUsers(users);
    }
    const updated = { ...sess, name: newName };
    this.session.set(updated);
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(updated));
  }

  private startSession(sess: Session) {
    this.session.set(sess);
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(sess));
  }
}
