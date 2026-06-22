import { Component, OnInit, signal, computed, inject, output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { OnboardingService, OnboardingBudget } from '../../../../core/services/onboarding.service';
import { CurrencyPipe } from '@angular/common';

interface Category { id: string; name: string; color: string; type: string; isGlobal: boolean; }

const GENERAL_ID = '__general__';

@Component({
  selector:    'app-step-budgets',
  standalone:  true,
  imports:     [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './step-budgets.component.html',
})
export class StepBudgetsComponent implements OnInit {
  private api = inject(ApiService);
  private fb  = inject(FormBuilder);
  private onboardingService = inject(OnboardingService);

  next = output<void>();

  categories       = signal<Category[]>([]);
  selectedCatId    = signal<string | null>(null);
  isLoadingCats    = signal(true);
  isSaving         = signal(false);
  errorMsg         = signal<string | null>(null);
  createdBudgets   = signal<OnboardingBudget[]>([]);
  editingIndex     = signal<number | null>(null);

  hasBudgets = computed(() => this.createdBudgets().length > 0);
  isEditing  = computed(() => this.editingIndex() !== null);

  usedCategoryIds = computed(() => {
    const ids = new Set<string>();
    for (const b of this.createdBudgets()) {
      ids.add(b.categoryId || GENERAL_ID);
    }
    return ids;
  });

  isCategoryUsed = computed(() => (id: string) => this.usedCategoryIds().has(id));

  form = this.fb.group({
    amount: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    const saved = this.onboardingService.collectedData().budgets;
    this.createdBudgets.set(saved);

    this.api.get<Category[]>('/finances/categories').subscribe({
      next: (cats) => {
        this.categories.set(cats.filter(c => c.type === 'EXPENSE'));
        this.isLoadingCats.set(false);
      },
      error: () => this.isLoadingCats.set(false),
    });
  }

  isDisabled(id: string): boolean {
    if (this.isEditing()) return false;
    return this.usedCategoryIds().has(id);
  }

  selectCategory(id: string): void {
    if (this.isDisabled(id)) return;
    this.errorMsg.set(null);
    this.selectedCatId.update(current => current === id ? null : id);
  }

  filterAmount(event: KeyboardEvent): void {
    const allowed = ['0','1','2','3','4','5','6','7','8','9','.','Backspace','Tab','ArrowLeft','ArrowRight','Delete','Home','End'];
    if (!allowed.includes(event.key) && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
    }
  }

  onAmountInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleaned = input.value.replace(/^0+(?=\d)/, '');
    if (cleaned !== input.value) {
      this.form.controls.amount.setValue(cleaned === '' ? null : Number(cleaned));
    }
  }

  private getDateRange(): { startDate: string; endDate: string } {
    const now = new Date();
    return {
      startDate: new Date(now.getFullYear(), now.getMonth(), 1)
                   .toISOString().split('T')[0],
      endDate:   new Date(now.getFullYear(), now.getMonth() + 1, 0)
                   .toISOString().split('T')[0],
    };
  }

  startEdit(index: number): void {
    const budget = this.createdBudgets()[index];
    this.editingIndex.set(index);
    this.selectedCatId.set(budget.categoryId || GENERAL_ID);
    this.form.patchValue({ amount: budget.amount });
    this.errorMsg.set(null);
  }

  cancelEdit(): void {
    this.editingIndex.set(null);
    this.selectedCatId.set(null);
    this.form.reset();
    this.errorMsg.set(null);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (!this.selectedCatId()) {
      this.errorMsg.set('Selecciona una categoria o selecciona General.');
      return;
    }

    this.isSaving.set(true);
    this.errorMsg.set(null);

    const isGeneral = this.selectedCatId() === GENERAL_ID;
    const cat = this.categories().find(c => c.id === this.selectedCatId());
    const payload: Record<string, any> = {
      amount: Number(this.form.value.amount),
      period: 'MONTHLY',
      ...this.getDateRange(),
    };
    if (!isGeneral) payload['categoryId'] = this.selectedCatId()!;

    if (this.isEditing()) {
      const idx = this.editingIndex()!;
      const budget = this.createdBudgets()[idx];
      this.api.patch<any>(`/finances/budgets/${budget.id}`, payload).subscribe({
        next: (res) => {
          const updated = {
            ...budget,
            categoryId:   isGeneral ? '' : this.selectedCatId()!,
            categoryName: isGeneral ? 'General' : cat?.name ?? '',
            amount:       Number(this.form.value.amount),
          };
          this.createdBudgets.update(list => list.map((b, i) => i === idx ? updated : b));
          this.syncToService();
          this.isSaving.set(false);
          this.cancelEdit();
        },
        error: () => {
          this.isSaving.set(false);
          this.errorMsg.set('No se pudo actualizar el presupuesto.');
        },
      });
    } else {
      this.api.post<any>('/finances/budgets', payload).subscribe({
        next: (res) => {
          const newBudget: OnboardingBudget = {
            id:           res.id,
            categoryId:   isGeneral ? '' : this.selectedCatId()!,
            categoryName: isGeneral ? 'General' : cat?.name ?? '',
            amount:       Number(this.form.value.amount),
            period:       'MONTHLY',
          };
          this.createdBudgets.update(list => [...list, newBudget]);
          this.onboardingService.addBudget(newBudget);
          this.isSaving.set(false);
          this.form.reset();
          this.selectedCatId.set(null);
        },
        error: () => {
          this.isSaving.set(false);
          this.errorMsg.set('No se pudo crear el presupuesto. Intenta de nuevo.');
        },
      });
    }
  }

  private syncToService(): void {
    const list = this.createdBudgets();
    this.onboardingService.collectedData.update(d => ({ ...d, budgets: list }));
  }

  continue(): void {
    this.next.emit();
  }

  skip(): void {
    this.next.emit();
  }

  removeBudget(index: number): void {
    const budget = this.createdBudgets()[index];
    this.api.delete(`/finances/budgets/${budget.id}`).subscribe({ error: () => {} });
    this.onboardingService.removeBudget(budget.id);
    this.createdBudgets.update(list => list.filter((_, i) => i !== index));
    if (this.editingIndex() === index) this.cancelEdit();
  }
}
