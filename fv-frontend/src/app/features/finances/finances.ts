import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../core/services/finance.service';
import {
  Account, Transaction, Category, Budget, Goal,
  BudgetHealth, FinanceSummary, TransactionAlert
} from '../../core/models/finance.model';

type Tab = 'resumen' | 'transacciones' | 'presupuestos' | 'metas';

@Component({
  selector: 'app-finances',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './finances.html',
  styleUrl: './finances.css'
})
export class Finances implements OnInit {
  activeTab = signal<Tab>('resumen');
  loading = signal(true);
  summary = signal<FinanceSummary | null>(null);
  health = signal<BudgetHealth | null>(null);
  accounts = signal<Account[]>([]);
  transactions = signal<Transaction[]>([]);
  categories = signal<Category[]>([]);
  budgets = signal<Budget[]>([]);
  goals = signal<Goal[]>([]);
  lastAlert = signal<TransactionAlert | null>(null);

  showAccountForm = signal(false);
  showTransactionForm = signal(false);
  showBudgetForm = signal(false);
  showGoalForm = signal(false);

  newAccount = { name: '', type: 'CHECKING' as const, balance: 0, currency: 'USD' };
  newTransaction = {
    accountId: '', categoryId: '', amount: 0,
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE' | 'TRANSFER',
    description: '', date: new Date().toISOString().split('T')[0]
  };
  newBudget = { categoryId: '', amount: 0, period: 'MONTHLY' as 'MONTHLY' | 'WEEKLY' };
  newGoal = { name: '', targetAmount: 0, currentAmount: 0, deadline: '' };

  expenseCategories = computed(() => this.categories().filter(c => c.type === 'EXPENSE'));
  filteredCategories = computed(() => {
    const t = this.newTransaction.type;
    if (t === 'INCOME') return this.categories().filter(c => c.type === 'INCOME');
    if (t === 'EXPENSE') return this.categories().filter(c => c.type === 'EXPENSE');
    return this.categories();
  });

  tabs: { key: Tab; label: string }[] = [
    { key: 'resumen', label: 'Resumen' },
    { key: 'transacciones', label: 'Transacciones' },
    { key: 'presupuestos', label: 'Presupuestos' },
    { key: 'metas', label: 'Metas' }
  ];

  constructor(private financeService: FinanceService) { }

  ngOnInit(): void {
    let loaded = 0;
    const done = () => { if (++loaded >= 7) this.loading.set(false); };
    this.financeService.getSummary().subscribe({ next: d => { this.summary.set(d); done(); }, error: done });
    this.financeService.getBudgetHealth().subscribe({ next: d => { this.health.set(d); done(); }, error: done });
    this.financeService.getAccounts().subscribe({ next: d => { this.accounts.set(d); done(); }, error: done });
    this.financeService.getTransactions().subscribe({ next: d => { this.transactions.set(d); done(); }, error: done });
    this.financeService.getCategories().subscribe({ next: d => { this.categories.set(d); done(); }, error: done });
    this.financeService.getBudgets().subscribe({ next: d => { this.budgets.set(d); done(); }, error: done });
    this.financeService.getGoals().subscribe({ next: d => { this.goals.set(d); done(); }, error: done });
  }

  setTab(t: Tab) { this.activeTab.set(t); }
  dismissAlert() { this.lastAlert.set(null); }

  submitAccount(): void {
    this.financeService.createAccount(this.newAccount).subscribe({
      next: acc => {
        this.accounts.update(l => [acc, ...l]);
        this.financeService.getSummary().subscribe({ next: d => this.summary.set(d) });
        this.showAccountForm.set(false);
        this.newAccount = { name: '', type: 'CHECKING', balance: 0, currency: 'USD' };
      }
    });
  }

  deleteAccount(id: string): void {
    this.financeService.deleteAccount(id).subscribe({
      next: () => {
        this.accounts.update(l => l.filter(a => a.id !== id));
        this.financeService.getSummary().subscribe({ next: d => this.summary.set(d) });
      }
    });
  }

  submitTransaction(): void {
    const payload = { ...this.newTransaction, amount: String(this.newTransaction.amount) };
    this.financeService.createTransaction(payload).subscribe({
      next: res => {
        this.transactions.update(l => [res.transaction, ...l]);
        if (res.alert) this.lastAlert.set(res.alert);
        this.financeService.getSummary().subscribe({ next: d => this.summary.set(d) });
        this.financeService.getBudgetHealth().subscribe({ next: d => this.health.set(d) });
        this.showTransactionForm.set(false);
        this.newTransaction = { accountId: '', categoryId: '', amount: 0, type: 'EXPENSE', description: '', date: new Date().toISOString().split('T')[0] };
      }
    });
  }

  deleteTransaction(id: string): void {
    this.financeService.deleteTransaction(id).subscribe({
      next: () => {
        this.transactions.update(l => l.filter(t => t.id !== id));
        this.financeService.getSummary().subscribe({ next: d => this.summary.set(d) });
        this.financeService.getBudgetHealth().subscribe({ next: d => this.health.set(d) });
      }
    });
  }

  submitBudget(): void {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const payload = {
      categoryId: this.newBudget.categoryId,
      amount: this.newBudget.amount,
      period: this.newBudget.period,
      startDate,
      endDate,
    };
    this.financeService.createBudget(payload).subscribe({
      next: b => {
        this.budgets.update(l => [b, ...l]);
        this.showBudgetForm.set(false);
        this.newBudget = { categoryId: '', amount: 0, period: 'MONTHLY' };
      }
    });
  }

  submitGoal(): void {
    this.financeService.createGoal(this.newGoal).subscribe({
      next: g => {
        this.goals.update(l => [g, ...l]);
        this.showGoalForm.set(false);
        this.newGoal = { name: '', targetAmount: 0, currentAmount: 0, deadline: '' };
      }
    });
  }

  getBudgetPercent(b: Budget): number {
    return !b.amount ? 0 : Math.min(100, Math.round((b.spent / b.amount) * 100));
  }
  getBudgetStatusColor(b: Budget): string {
    const p = this.getBudgetPercent(b);
    if (p >= 100) return 'from-red-500 to-red-400';
    if (p >= 80) return 'from-amber-500 to-amber-400';
    return 'from-emerald-500 to-emerald-400';
  }
  getBudgetCategory(b: Budget): string {
    return this.categories().find(c => c.id === b.categoryId)?.name ?? 'Categoria';
  }
  getGoalPercent(g: Goal): number {
    return !g.targetAmount ? 0 : Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
  }
  formatCurrency(v: number | string): string {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(
      typeof v === 'string' ? parseFloat(v) : v
    );
  }
  getHealthColor(s: string): string {
    return ({ HEALTHY: 'text-emerald-400', WARNING: 'text-amber-400', DANGER: 'text-orange-400', CRITICAL: 'text-red-400' } as any)[s] ?? 'text-slate-400';
  }
  getHealthBarColor(s: string): string {
    return ({ HEALTHY: 'from-emerald-500 to-emerald-400', WARNING: 'from-amber-500 to-amber-400', DANGER: 'from-orange-500 to-orange-400', CRITICAL: 'from-red-500 to-red-400' } as any)[s] ?? 'from-slate-500 to-slate-400';
  }
  getTransactionColor(t: string): string { return t === 'INCOME' ? 'text-emerald-400' : 'text-red-400'; }
  getTransactionSign(t: string): string { return t === 'INCOME' ? '+' : '-'; }
  getAccountTypeLabel(t: string): string {
    return ({ CHECKING: 'Corriente', SAVINGS: 'Ahorros', CREDIT: 'Credito', CASH: 'Efectivo' } as any)[t] ?? t;
  }
  getAccountTypeColor(t: string): string {
    return ({ CHECKING: 'bg-blue-500/20 text-blue-400 border-blue-500/30', SAVINGS: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', CREDIT: 'bg-red-500/20 text-red-400 border-red-500/30', CASH: 'bg-amber-500/20 text-amber-400 border-amber-500/30' } as any)[t] ?? 'bg-slate-500/20 text-slate-400';
  }
  getCategoryName(id: string): string { return this.categories().find(c => c.id === id)?.name ?? 'Sin categoria'; }
  getAccountName(id: string): string { return this.accounts().find(a => a.id === id)?.name ?? 'Cuenta'; }
}