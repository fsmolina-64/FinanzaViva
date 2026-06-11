export type AccountType = 'CASH' | 'BANK' | 'DIGITAL_WALLET';
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type BudgetPeriod = 'MONTHLY' | 'WEEKLY';
export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type BudgetHealthStatus = 'HEALTHY' | 'WARNING' | 'DANGER' | 'CRITICAL';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: string;
  currency: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  type: 'INCOME' | 'EXPENSE';
  isGlobal: boolean;
  userId?: string | null;
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
  category?: Category;
  account?: Account;
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

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: string;
  period: BudgetPeriod;
  startDate: string;
  endDate?: string | null;
  createdAt: string;
  category?: Category;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  deadline?: string | null;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetHealth {
  income: number;
  expenses: number;
  available: number;
  percentage: number;
  status: BudgetHealthStatus;
  message: string;
  breakdown: Record<string, number>;
}

export interface FinanceSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

export interface CreateAccountPayload {
  name: string;
  type: AccountType;
  initialBalance?: number;
}

export interface CreateTransactionPayload {
  accountId: string;
  categoryId: string;
  amount: number;
  type: TransactionType;
  description?: string;
  date: string;
}

export interface CreateBudgetPayload {
  categoryId: string;
  amount: number;
  period: BudgetPeriod;
  startDate: string;
  endDate?: string;
}

export interface CreateGoalPayload {
  name: string;
  targetAmount: number;
  deadline?: string;
}

export interface UpdateTransactionPayload {
  categoryId?: string;
  amount?: number;
  type?: TransactionType;
  description?: string;
  date?: string;
}

export interface UpdateBudgetPayload {
  amount?: number;
  period?: BudgetPeriod;
  endDate?: string;
}

export interface UpdateGoalPayload {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  deadline?: string;
  status?: GoalStatus;
}