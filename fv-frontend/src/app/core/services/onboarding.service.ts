import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface OnboardingAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
}

export interface OnboardingGoal {
  id: string;
  name: string;
  targetAmount: number;
  deadline: string;
}

export interface OnboardingBudget {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  period: string;
}

export interface OnboardingCategory {
  id: string;
  name: string;
  type: string;
  color: string;
}

export interface OnboardingEditedCategory {
  id: string;
  oldName: string;
  newName: string;
  type: string;
}

export interface OnboardingDeletedCategory {
  id: string;
  name: string;
  type: string;
}

export interface OnboardingData {
  accounts: OnboardingAccount[];
  goals: OnboardingGoal[];
  budgets: OnboardingBudget[];
  customCategories: OnboardingCategory[];
  editedCategories: OnboardingEditedCategory[];
  deletedCategories: OnboardingDeletedCategory[];
}

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly COMPLETED_KEY = 'fv_onboarding_completed';
  private readonly STEP_KEY      = 'fv_onboarding_step';

  onboardingCompleted = signal<boolean | null>(this.readFromStorage());
  collectedData       = signal<OnboardingData>({
    accounts: [], goals: [], budgets: [], customCategories: [],
    editedCategories: [], deletedCategories: [],
  });

  constructor(private api: ApiService) {
    this.clearAll();
  }

  private readFromStorage(): boolean | null {
    return null;
  }

  isCompleted(): boolean | null {
    return this.onboardingCompleted();
  }

  cacheStatus(completed: boolean): void {
    this.onboardingCompleted.set(completed);
    localStorage.setItem(this.COMPLETED_KEY, String(completed));
  }

  setCompleted(): void {
    this.cacheStatus(true);
    localStorage.removeItem(this.STEP_KEY);
  }

  clearAll(): void {
    this.onboardingCompleted.set(null);
    this.collectedData.set({ accounts: [], goals: [], budgets: [], customCategories: [], editedCategories: [], deletedCategories: [] });
    localStorage.removeItem(this.COMPLETED_KEY);
    localStorage.removeItem(this.STEP_KEY);
  }

  saveStep(step: number): void {
    localStorage.setItem(this.STEP_KEY, String(step));
  }

  getSavedStep(): number {
    return parseInt(localStorage.getItem(this.STEP_KEY) ?? '0', 10);
  }

  completeOnboarding(): Observable<any> {
    return this.api.patch('/users/onboarding', { onboardingCompleted: true });
  }

  fetchProfile(): Observable<any> {
    return this.api.get('/users/me');
  }

  addAccount(account: OnboardingAccount): void {
    this.collectedData.update(d => ({ ...d, accounts: [...d.accounts, account] }));
  }

  addGoal(goal: OnboardingGoal): void {
    this.collectedData.update(d => ({ ...d, goals: [...d.goals, goal] }));
  }

  addBudget(budget: OnboardingBudget): void {
    this.collectedData.update(d => ({ ...d, budgets: [...d.budgets, budget] }));
  }

  addCustomCategory(cat: OnboardingCategory): void {
    this.collectedData.update(d => ({ ...d, customCategories: [...d.customCategories, cat] }));
  }

  removeAccount(id: string): void {
    this.collectedData.update(d => ({ ...d, accounts: d.accounts.filter(a => a.id !== id) }));
  }

  removeBudget(id: string): void {
    this.collectedData.update(d => ({ ...d, budgets: d.budgets.filter(b => b.id !== id) }));
  }

  removeGoal(id: string): void {
    this.collectedData.update(d => ({ ...d, goals: d.goals.filter(g => g.id !== id) }));
  }

  addEditedCategory(cat: OnboardingEditedCategory): void {
    this.collectedData.update(d => ({
      ...d,
      editedCategories: [...d.editedCategories.filter(c => c.id !== cat.id), cat],
    }));
  }

  addDeletedCategory(cat: OnboardingDeletedCategory): void {
    this.collectedData.update(d => ({
      ...d,
      deletedCategories: [...d.deletedCategories.filter(c => c.id !== cat.id), cat],
    }));
  }
}
