import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Account,
  Transaction,
  TransactionResponse,
  Category,
  Budget,
  Goal,
  BudgetHealth,
  FinanceSummary
} from '../models/finance.model';

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  constructor(private api: ApiService) {}

  getSummary(): Observable<FinanceSummary> {
    return this.api.get<FinanceSummary>('/finances/summary');
  }

  getBudgetHealth(): Observable<BudgetHealth> {
    return this.api.get<BudgetHealth>('/finances/budget-health');
  }

  getAccounts(): Observable<Account[]> {
    return this.api.get<Account[]>('/finances/accounts');
  }

  createAccount(data: Partial<Account>): Observable<Account> {
    return this.api.post<Account>('/finances/accounts', data);
  }

  deleteAccount(id: string): Observable<void> {
    return this.api.delete<void>(`/finances/accounts/${id}`);
  }

  getTransactions(): Observable<Transaction[]> {
    return this.api.get<Transaction[]>('/finances/transactions');
  }

  createTransaction(data: Partial<Transaction>): Observable<TransactionResponse> {
    return this.api.post<TransactionResponse>('/finances/transactions', data);
  }

  deleteTransaction(id: string): Observable<void> {
    return this.api.delete<void>(`/finances/transactions/${id}`);
  }

  getCategories(): Observable<Category[]> {
    return this.api.get<Category[]>('/finances/categories');
  }

  getBudgets(): Observable<Budget[]> {
    return this.api.get<Budget[]>('/finances/budgets');
  }

  createBudget(data: Partial<Budget>): Observable<Budget> {
    return this.api.post<Budget>('/finances/budgets', data);
  }

  getGoals(): Observable<Goal[]> {
    return this.api.get<Goal[]>('/finances/goals');
  }

  createGoal(data: Partial<Goal>): Observable<Goal> {
    return this.api.post<Goal>('/finances/goals', data);
  }
}