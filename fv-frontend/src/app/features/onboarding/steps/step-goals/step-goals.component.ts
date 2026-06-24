import { Component, signal, inject, output, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService }        from '../../../../core/services/api.service';
import { ToastService }      from '../../../../core/services/toast.service';
import { OnboardingService, OnboardingGoal } from '../../../../core/services/onboarding.service';
import { CurrencyPipe } from '@angular/common';
import { filterAmountKey, sanitizeNumberInput } from '../../../../shared/utils/amount.utils';

@Component({
  selector:    'app-step-goals',
  standalone:  true,
  imports:     [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './step-goals.component.html',
})
export class StepGoalsComponent {
  private api = inject(ApiService);
  private fb  = inject(FormBuilder);
  private onboardingService = inject(OnboardingService);
  private toast = inject(ToastService);

  next = output<void>();
  skip = output<void>();

  isLoading      = signal(false);
  isDeletingId   = signal<string | null>(null);
  errorMsg       = signal<string | null>(null);
  editingId      = signal<string | null>(null);
  minDate        = new Date().toISOString().split('T')[0];
  createdGoals   = computed(() => this.onboardingService.collectedData().goals);
  hasGoals       = computed(() => this.createdGoals().length > 0);

  form = this.fb.group({
    name:         ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    targetAmount: ['', [Validators.required, Validators.min(0.01)]],
    deadline:     [''],
  });

  examples = [
    { label: 'Fondo de emergencia', amount: 1000 },
    { label: 'Viaje',               amount: 500  },
    { label: 'Laptop nueva',        amount: 800  },
    { label: 'Auto',                amount: 5000 },
  ];

  filterAmount = filterAmountKey;

  onAmountInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleaned = sanitizeNumberInput(input.value);
    if (input.value !== cleaned) {
      const pos = input.selectionStart;
      input.value = cleaned;
      if (pos) input.setSelectionRange(pos, pos);
    }
    this.form.controls.targetAmount.setValue(cleaned, { emitEvent: false });
  }

  fillExample(ex: { label: string; amount: number }): void {
    this.form.patchValue({ name: ex.label, targetAmount: String(ex.amount) });
  }

  startEdit(goal: OnboardingGoal): void {
    this.editingId.set(goal.id);
    this.form.patchValue({
      name:         goal.name,
      targetAmount: String(goal.targetAmount),
      deadline:     goal.deadline || '',
    });
    this.errorMsg.set(null);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset();
    this.errorMsg.set(null);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    if (this.editingId()) {
      this.updateGoal();
    } else {
      this.createGoal();
    }
  }

  private createGoal(): void {
    this.isLoading.set(true);
    this.errorMsg.set(null);

    const payload: Record<string, any> = {
      name:         this.form.value.name!.trim(),
      targetAmount: Number(this.form.value.targetAmount),
    };
    if (this.form.value.deadline) payload['deadline'] = this.form.value.deadline;

    this.api.post<any>('/finances/goals', payload).subscribe({
      next: (goal) => {
        this.onboardingService.addGoal({
          id:           goal.id,
          name:         goal.name,
          targetAmount: parseFloat(String(goal.targetAmount)),
          deadline:     goal.deadline ? String(goal.deadline).split('T')[0] : '',
        });
        this.isLoading.set(false);
        this.form.reset();
        this.toast.success('Meta creada.');
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMsg.set('No se pudo crear la meta. Puedes agregarla desde Finanzas.');
        this.toast.error('No se pudo crear la meta.');
      },
    });
  }

  private updateGoal(): void {
    this.isLoading.set(true);
    this.errorMsg.set(null);

    const payload: Record<string, any> = {
      name:         this.form.value.name!.trim(),
      targetAmount: Number(this.form.value.targetAmount),
    };
    if (this.form.value.deadline) payload['deadline'] = this.form.value.deadline;

    this.api.patch<any>(`/finances/goals/${this.editingId()}`, payload).subscribe({
      next: (res) => {
        const id = this.editingId()!;
        this.onboardingService.collectedData.update(d => ({
          ...d,
          goals: d.goals.map(g =>
            g.id === id ? {
              ...g,
              name:         res.name ?? payload['name'],
              targetAmount: parseFloat(String(res.targetAmount ?? payload['targetAmount'])),
              deadline:     res.deadline ? String(res.deadline).split('T')[0] : payload['deadline'] ?? '',
            } : g
          ),
        }));
        this.isLoading.set(false);
        this.cancelEdit();
        this.toast.success('Meta actualizada.');
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMsg.set('No se pudo actualizar la meta.');
        this.toast.error('No se pudo actualizar la meta.');
      },
    });
  }

  deleteCreatedGoal(goal: OnboardingGoal): void {
    if (this.isDeletingId() === goal.id) return;
    this.isDeletingId.set(goal.id);
    this.api.delete(`/finances/goals/${goal.id}`).subscribe({
      next: () => {
        this.onboardingService.removeGoal(goal.id);
        this.isDeletingId.set(null);
        if (this.editingId() === goal.id) this.cancelEdit();
        this.toast.success('Meta eliminada.');
      },
      error: () => {
        this.isDeletingId.set(null);
        this.toast.error('No se pudo eliminar la meta.');
      },
    });
  }
}
