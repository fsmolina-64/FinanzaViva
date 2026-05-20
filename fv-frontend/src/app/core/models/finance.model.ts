export type AccountType = 'CHECKING' | 'SAVINGS' | 'CREDIT' | 'CASH';
export type TransactionType = 'INCOME' | 'EXPENSE';
export type BudgetStatus = 'HEALTHY' | 'WARNING' | 'DANGER' | 'CRITICAL';
export type AlertType = 'BUDGET_WARNING' | 'BUDGET_EXCEEDED' | null;

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  accountId: string;
  description?: string;
  date: string;
}

export interface TransactionResponse {
  transaction: Transaction;
  alert: AlertType;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  type: TransactionType;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  spent: number;
  month: number;
  year: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
}

export interface BudgetHealth {
  status: BudgetStatus;
  totalBudget: number;
  totalSpent: number;
  percentage: number;
  message: string;
}

export interface FinanceSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  savingsRate: number;
}