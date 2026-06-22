import { Component, signal, output, inject, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService }       from '../../../../core/services/api.service';
import { ToastService }     from '../../../../core/services/toast.service';
import { OnboardingService, OnboardingAccount } from '../../../../core/services/onboarding.service';
import { CurrencyPipe } from '@angular/common';

type AccountType = 'CASH' | 'BANK' | 'DIGITAL_WALLET';

@Component({
  selector: 'app-step-account',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './step-account.component.html',
  styleUrl: './step-account.component.css',
})
export class StepAccountComponent {
  private api = inject(ApiService);
  private fb  = inject(FormBuilder);
  private onboardingService = inject(OnboardingService);
  private toast = inject(ToastService);

  next = output<void>();

  selectedType     = signal<AccountType>('CASH');
  isLoading        = signal(false);
  isDeletingId     = signal<string | null>(null);
  errorMsg         = signal<string | null>(null);
  editingId        = signal<string | null>(null);
  createdAccounts   = computed(() => this.onboardingService.collectedData().accounts);
  hasAccounts       = computed(() => this.createdAccounts().length > 0);

  form = this.fb.group({
    name:    ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    balance: [0,  [Validators.required, Validators.min(0)]],
  });

  accountTypes = [
    { value: 'CASH' as AccountType, label: 'Efectivo', desc: 'Dinero en mano', path: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
    { value: 'BANK' as AccountType, label: 'Banco', desc: 'Cuenta bancaria', path: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { value: 'DIGITAL_WALLET' as AccountType, label: 'Digital', desc: 'Billetera virtual', path: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
  ];

  filterBalance(event: KeyboardEvent): void {
    const allowed = ['0','1','2','3','4','5','6','7','8','9','.','Backspace','Tab','ArrowLeft','ArrowRight','Delete','Home','End'];
    if (!allowed.includes(event.key) && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
    }
  }

  onBalanceInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleaned = input.value.replace(/^0+(?=\d)/, '');
    if (cleaned !== input.value) {
      this.form.controls.balance.setValue(cleaned === '' ? 0 : Number(cleaned));
    }
  }

  startEdit(account: OnboardingAccount): void {
    this.editingId.set(account.id);
    this.selectedType.set(account.type as AccountType);
    this.form.patchValue({ name: account.name, balance: account.balance });
    this.errorMsg.set(null);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset();
    this.selectedType.set('CASH');
    this.errorMsg.set(null);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    if (this.editingId()) {
      this.updateAccount();
    } else {
      this.createAccount();
    }
  }

  private createAccount(): void {
    this.isLoading.set(true);
    this.errorMsg.set(null);

    const payload = {
      name:           this.form.value.name!.trim(),
      type:           this.selectedType(),
      initialBalance: Number(this.form.value.balance),
    };

    this.api.post<any>('/finances/accounts', payload).subscribe({
      next: (account) => {
        this.onboardingService.addAccount({
          id:      account.id,
          name:    account.name,
          type:    account.type,
          balance: parseFloat(String(account.balance)),
        });
        this.isLoading.set(false);
        this.form.reset();
        this.selectedType.set('CASH');
        this.toast.success('Cuenta creada exitosamente.');
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMsg.set('No se pudo crear la cuenta. Verifica los datos e intenta de nuevo.');
        this.toast.error('No se pudo crear la cuenta.');
      },
    });
  }

  private updateAccount(): void {
    this.isLoading.set(true);
    this.errorMsg.set(null);

    const payload = {
      name:    this.form.value.name!.trim(),
      type:    this.selectedType(),
      balance: Number(this.form.value.balance),
    };

    this.api.patch<any>(`/finances/accounts/${this.editingId()}`, payload).subscribe({
      next: (res) => {
        const id = this.editingId()!;
        this.onboardingService.collectedData.update(d => ({
          ...d,
          accounts: d.accounts.map(a =>
            a.id === id ? {
              ...a,
              name:    res.name ?? payload.name,
              type:    res.type ?? payload.type,
              balance: res.balance !== undefined ? parseFloat(String(res.balance)) : payload.balance,
            } : a
          ),
        }));
        this.isLoading.set(false);
        this.cancelEdit();
        this.toast.success('Cuenta actualizada.');
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMsg.set('No se pudo actualizar la cuenta.');
        this.toast.error('No se pudo actualizar la cuenta.');
      },
    });
  }

  deleteCreatedAccount(account: OnboardingAccount): void {
    if (this.isDeletingId() === account.id) return;
    this.isDeletingId.set(account.id);
    this.errorMsg.set(null);

    this.api.delete(`/finances/accounts/${account.id}`).subscribe({
      next: () => {
        this.onboardingService.removeAccount(account.id);
        this.isDeletingId.set(null);
        this.toast.success('Cuenta eliminada.');
        if (this.editingId() === account.id) this.cancelEdit();
      },
      error: (err) => {
        this.isDeletingId.set(null);
        const msg = err?.error?.message || 'No se pudo eliminar la cuenta. Puede tener transacciones asociadas.';
        this.errorMsg.set(msg);
      },
    });
  }
}
