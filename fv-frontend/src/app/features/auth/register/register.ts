import { Component, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { getPasswordStrength, PasswordStrengthResult } from '../../../core/utils/password-strength.util';
import { IconComponent } from '../../../shared/components/icon/icon';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, CommonModule, RouterLink, IconComponent],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  form: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);
  passwordValue = signal('');

  readonly strengthSegments = [0, 1, 2, 3];

  passwordStrength = computed<PasswordStrengthResult>(() =>
    getPasswordStrength(this.passwordValue())
  );

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatch });
  }

  get displayName() { return this.form.get('displayName')!; }
  get email() { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }
  get confirmPassword() { return this.form.get('confirmPassword')!; }

  passwordMatch(group: FormGroup) {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { mismatch: true };
  }

  onPasswordInput(value: string): void {
    this.passwordValue.set(value);
  }

  getStrengthBarColor(score: number): string {
    if (score <= 1) return 'bg-danger';
    if (score === 2) return 'bg-warning';
    return 'bg-success';
  }

  getStrengthLabelColor(score: number): string {
    if (score <= 1) return 'text-danger';
    if (score === 2) return 'text-warning';
    return 'text-success';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    const { displayName, email, password } = this.form.value;

    this.authService.register({ displayName, email, password }).subscribe({
      next: () => this.router.navigate(['/onboarding']),
      error: (err) => {
        const msg = err.error?.message;
        this.error.set(Array.isArray(msg) ? msg[0] : msg || 'Error al registrarse');
        this.loading.set(false);
      }
    });
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }
}