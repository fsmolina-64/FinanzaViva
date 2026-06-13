export type AccountType = 'CHECKING' | 'SAVINGS' | 'CREDIT' | 'CASH';
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type BudgetStatus = 'HEALTHY' | 'WARNING' | 'DANGER' | 'CRITICAL';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string;
  amount: string;
  type: TransactionType;
  description: string | null;
  date: string;
  createdAt: string;
}

export interface TransactionAlert {
  type: 'BUDGET_WARNING' | 'BUDGET_EXCEEDED';
  message: string;
  percentage: number;
}

export interface TransactionResponse {
  transaction: Transaction;
  alert: TransactionAlert | null;
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
  income: number;
  expenses: number;
  available: number;
  percentage: number;
  status: BudgetStatus;
  message: string;
  breakdown: Record<string, number>;
}

export type GoalStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface UpdateGoalPayload {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  deadline?: string;
  status?: GoalStatus;
  fromAccountId?: string;
}

export interface FinanceSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}