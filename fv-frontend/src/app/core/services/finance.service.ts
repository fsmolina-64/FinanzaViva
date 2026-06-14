import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Account, Transaction, TransactionResponse,
  Category, Budget, Goal, BudgetHealth, FinanceSummary,
  CreateAccountPayload, CreateTransactionPayload,
  CreateBudgetPayload, CreateGoalPayload,
  UpdateTransactionPayload, UpdateBudgetPayload, UpdateGoalPayload,
   CreateTransferPayload, TransferResponse,
   CreateCategoryPayload, UpdateCategoryPayload
} from '../models/finance.model';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  constructor(private api: ApiService) { }

  getSummary(): Observable<FinanceSummary> {
    return this.api.get<FinanceSummary>('/finances/summary');
  }

  getBudgetHealth(): Observable<BudgetHealth> {
    return this.api.get<BudgetHealth>('/finances/budget-health');
  }

  getAccounts(): Observable<Account[]> {
    return this.api.get<Account[]>('/finances/accounts');
  }

  createAccount(data: CreateAccountPayload): Observable<Account> {
    return this.api.post<Account>('/finances/accounts', data);
  }

  deleteAccount(id: string): Observable<void> {
    return this.api.delete<void>(`/finances/accounts/${id}`);
  }

  getTransactions(): Observable<Transaction[]> {
    return this.api.get<Transaction[]>('/finances/transactions');
  }

  createTransaction(data: CreateTransactionPayload): Observable<TransactionResponse> {
    return this.api.post<TransactionResponse>('/finances/transactions', data);
  }

  updateTransaction(id: string, data: UpdateTransactionPayload): Observable<Transaction> {
    return this.api.patch<Transaction>(`/finances/transactions/${id}`, data);
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

  createBudget(data: CreateBudgetPayload): Observable<Budget> {
    return this.api.post<Budget>('/finances/budgets', data);
  }

  updateBudget(id: string, data: UpdateBudgetPayload): Observable<Budget> {
    return this.api.patch<Budget>(`/finances/budgets/${id}`, data);
  }

  deleteBudget(id: string): Observable<void> {
    return this.api.delete<void>(`/finances/budgets/${id}`);
  }

  getGoals(): Observable<Goal[]> {
    return this.api.get<Goal[]>('/finances/goals');
  }

  createGoal(data: CreateGoalPayload): Observable<Goal> {
    return this.api.post<Goal>('/finances/goals', data);
  }

  updateGoal(id: string, data: UpdateGoalPayload): Observable<Goal> {
    return this.api.patch<Goal>(`/finances/goals/${id}`, data);
  }

  deleteGoal(id: string): Observable<void> {
    return this.api.delete<void>(`/finances/goals/${id}`);
  }

  createTransfer(data: CreateTransferPayload): Observable<TransferResponse> {
    return this.api.post<TransferResponse>('/finances/transfers', data);
  }

  createCategory(data: CreateCategoryPayload): Observable<Category> {
    return this.api.post<Category>('/finances/categories', data);
  }

  updateCategory(id: string, data: UpdateCategoryPayload): Observable<Category> {
    return this.api.patch<Category>(`/finances/categories/${id}`, data);
  }

  deleteCategory(id: string): Observable<void> {
    return this.api.delete<void>(`/finances/categories/${id}`);
  }
}