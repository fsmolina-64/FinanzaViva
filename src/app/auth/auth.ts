import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { ProfileService } from '../services/profile.service';
import { FinanzasService } from '../services/finanzas.service';

@Component({
  selector: 'app-auth',
  imports: [FormsModule, CommonModule],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
})
export class Auth {
  private auth = inject(AuthService);
  private profile = inject(ProfileService);
  private finanzas = inject(FinanzasService);
  private router = inject(Router);

  mode = signal<'login' | 'register'>('login');
  loading = signal(false);
  error = signal<string | null>(null);
  showPass = signal(false);

  // Form fields
  name = '';
  email = '';
  password = '';
  confirmPass = '';

  toggle() {
    this.mode.update(m => m === 'login' ? 'register' : 'login');
    this.error.set(null);
    this.name = this.email = this.password = this.confirmPass = '';
  }

  async submit() {
    this.error.set(null);
    if (!this.email || !this.password) { this.error.set('Completa todos los campos.'); return; }
    if (this.mode() === 'register') {
      if (!this.name.trim()) { this.error.set('El nombre es obligatorio.'); return; }
      if (this.password !== this.confirmPass) { this.error.set('Las contraseñas no coinciden.'); return; }
      if (this.password.length < 6) { this.error.set('Mínimo 6 caracteres en la contraseña.'); return; }
    }
    this.loading.set(true);
    await new Promise(r => setTimeout(r, 400)); // brief UX delay
    const result = this.mode() === 'login'
      ? this.auth.login(this.email.trim().toLowerCase(), this.password)
      : this.auth.register(this.name.trim(), this.email.trim().toLowerCase(), this.password);
    this.loading.set(false);
    if (!result.ok) { this.error.set(result.error ?? 'Error desconocido'); return; }
    // Load user-specific data before navigating
    this.profile.loadForCurrentUser();
    this.finanzas.loadForCurrentUser();
    this.router.navigate(['/home']);
  }
}
