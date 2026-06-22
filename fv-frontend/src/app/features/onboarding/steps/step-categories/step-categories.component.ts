import { Component, OnInit, signal, computed, inject, output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { OnboardingCategory, OnboardingService } from '../../../../core/services/onboarding.service';

interface Category {
  id:       string;
  name:     string;
  icon:     string;
  color:    string;
  type:     'INCOME' | 'EXPENSE';
  isGlobal: boolean;
}

type TabType = 'INCOME' | 'EXPENSE';

@Component({
  selector:    'app-step-categories',
  standalone:  true,
  imports:     [ReactiveFormsModule],
  templateUrl: './step-categories.component.html',
})
export class StepCategoriesComponent implements OnInit {
  private api          = inject(ApiService);
  private fb           = inject(FormBuilder);
  private onboarding   = inject(OnboardingService);
  private toast        = inject(ToastService);

  next = output<void>();
  categoryCreated = output<OnboardingCategory>();

  categories   = signal<Category[]>([]);
  activeTab    = signal<TabType>('EXPENSE');
  isLoading    = signal(true);

  editingId    = signal<string | null>(null);
  editName     = signal('');
  isEditSaving = signal(false);

  deletingId   = signal<string | null>(null);
  deleteError  = signal<string | null>(null);

  showAddForm  = signal(false);
  addLoading   = signal(false);
  addError     = signal<string | null>(null);

  addForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(30)]],
  });

  filteredCategories = computed(() =>
    this.categories().filter(c => c.type === this.activeTab())
  );

  ngOnInit(): void {
    this.loadCategories();
  }

  private loadCategories(): void {
    this.isLoading.set(true);
    this.api.get<Category[]>('/finances/categories').subscribe({
      next:  (cats) => { this.categories.set(cats); this.isLoading.set(false); },
      error: ()     => this.isLoading.set(false),
    });
  }

  setTab(tab: TabType): void {
    this.activeTab.set(tab);
    this.cancelEdit();
    this.showAddForm.set(false);
    this.addError.set(null);
  }

  startEdit(cat: Category): void {
    this.editingId.set(cat.id);
    this.editName.set(cat.name);
    this.deleteError.set(null);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editName.set('');
  }

  saveEdit(cat: Category): void {
    if (cat.isGlobal) { this.toast.warning('Las categorías predefinidas no se pueden editar.'); return; }

    const name = this.editName().trim();
    if (!name) { this.cancelEdit(); return; }
    if (name === cat.name) { this.cancelEdit(); return; }

    this.isEditSaving.set(true);
    this.api.patch<any>(`/finances/categories/${cat.id}`, { name }).subscribe({
      next: (updated) => {
        this.categories.update(cats =>
          cats.map(c => c.id === cat.id ? { ...c, name: updated.name ?? name } : c)
        );
        this.toast.success('Categoría actualizada.');
        this.isEditSaving.set(false);
        this.cancelEdit();
      },
      error: () => {
        this.isEditSaving.set(false);
        this.cancelEdit();
        this.toast.error('No se pudo actualizar la categoría.');
      },
    });
  }

  deleteCategory(cat: Category): void {
    if (cat.isGlobal) { this.toast.warning('Las categorías predefinidas no se pueden eliminar.'); return; }
    if (this.deletingId() === cat.id) return;
    this.deleteError.set(null);
    this.deletingId.set(cat.id);

    this.api.delete<any>(`/finances/categories/${cat.id}`).subscribe({
      next: () => {
        this.categories.update(cats => cats.filter(c => c.id !== cat.id));
        // Remove from customCategories if it was user-created
        this.onboarding.collectedData.update(d => ({
          ...d,
          customCategories: d.customCategories.filter(c => c.id !== cat.id),
        }));
        this.deletingId.set(null);
        this.toast.success('Categoría eliminada.');
      },
      error: () => {
        this.deletingId.set(null);
        this.deleteError.set(`No se pudo eliminar "${cat.name}". Puede estar en uso.`);
        this.toast.error(`No se pudo eliminar "${cat.name}". Puede estar en uso.`);
      },
    });
  }

  toggleAddForm(): void {
    this.showAddForm.update(v => !v);
    this.addForm.reset();
    this.addError.set(null);
  }

  submitAdd(): void {
    if (this.addForm.invalid) { this.addForm.markAllAsTouched(); return; }

    this.addLoading.set(true);
    this.addError.set(null);

    const payload = {
      name:  this.addForm.value.name!.trim(),
      type:  this.activeTab(),
      color: '#10b981',
      icon:  'tag',
    };

    this.api.post<Category>('/finances/categories', payload).subscribe({
      next: (cat) => {
        this.categories.update(cats => [...cats, cat]);
        this.categoryCreated.emit({ id: cat.id, name: cat.name, type: cat.type, color: cat.color });
        this.addLoading.set(false);
        this.addForm.reset();
        this.showAddForm.set(false);
      },
      error: () => {
        this.addLoading.set(false);
        this.addError.set('No se pudo crear la categoria. Intenta de nuevo.');
      },
    });
  }
}
