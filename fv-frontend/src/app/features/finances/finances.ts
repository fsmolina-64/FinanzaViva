import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../core/services/finance.service';
import { ToastService } from '../../core/services/toast.service';
import { QuickTransactionService, QuickTransactionResult } from '../../core/services/quick-transaction.service';
import {
  Account, Transaction, Category, Budget, Goal,
  BudgetHealth, FinanceSummary, TransactionAlert, AccountType
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

  newAccount = { name: '', type: 'CASH' as AccountType, initialBalance: 0 };
  newTransaction = {
    accountId: '', categoryId: '', amount: 0,
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE' | 'TRANSFER',
    description: '', date: new Date().toISOString().split('T')[0]
  };
  newBudget = { categoryId: '', amount: 0, period: 'MONTHLY' as 'MONTHLY' | 'WEEKLY' };
  newGoal = { name: '', targetAmount: 0, deadline: '' };

  editingTxId = signal<string | null>(null);
  editTx = {
    categoryId: '', amount: 0,
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE' | 'TRANSFER',
    description: '', date: ''
  };

  editingBudgetId = signal<string | null>(null);
  editBudgetAmount = 0;

  editingGoalId = signal<string | null>(null);
  editGoal = { name: '', targetAmount: 0, deadline: '' };

  addingProgressGoalId = signal<string | null>(null);
  progressAmount = 0;

  confirmDeleteTxId = signal<string | null>(null);
  confirmDeleteBudgetId = signal<string | null>(null);
  confirmDeleteGoalId = signal<string | null>(null);

  txFilter = signal<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');

  expenseCategories = computed(() =>
    this.categories().filter(c => c.type === 'EXPENSE')
  );

  filteredCategories = computed(() => {
    const t = this.newTransaction.type;
    if (t === 'INCOME') return this.categories().filter(c => c.type === 'INCOME');
    if (t === 'EXPENSE') return this.categories().filter(c => c.type === 'EXPENSE');
    return this.categories();
  });

  editTxCategories = computed(() => {
    const t = this.editTx.type;
    if (t === 'INCOME') return this.categories().filter(c => c.type === 'INCOME');
    if (t === 'EXPENSE') return this.categories().filter(c => c.type === 'EXPENSE');
    return this.categories();
  });


  filteredTransactions = computed(() => {
    const f = this.txFilter();
    return f === 'ALL'
      ? this.transactions()
      : this.transactions().filter(t => t.type === f);
  });

  recentTransactions = computed(() => this.transactions().slice(0, 5));

  groupedTransactions = computed(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of this.filteredTransactions()) {
      const key = tx.date.substring(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tx);
    }
    return Array.from(map.entries()).map(([date, items]) => ({
      date, label: this.formatDateLabel(date), items
    }));
  });

  tabs: { key: Tab; label: string }[] = [
    { key: 'resumen', label: 'Resumen' },
    { key: 'transacciones', label: 'Transacciones' },
    { key: 'presupuestos', label: 'Presupuestos' },
    { key: 'metas', label: 'Metas' }
  ];

  constructor(
    private financeService: FinanceService,
    private toast: ToastService,
    private quickTxService: QuickTransactionService
  ) {
    // Escucha transacciones registradas desde el FAB global
    effect(() => {
      const res = this.quickTxService.lastCreated();
      if (!res) return;
      // Dedup: solo agregar si no existe ya en la lista
      const exists = this.transactions().some(t => t.id === res.transaction.id);
      if (exists) return;
      this.transactions.update(l => [res.transaction, ...l]);
      if (res.alert) this.lastAlert.set(res.alert);
      this.refreshSummary();
    });
  }

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
    if (!this.newAccount.name.trim()) { this.toast.warning('Ingresa un nombre para la cuenta'); return; }
    const payload = {
      name: this.newAccount.name.trim(),
      type: this.newAccount.type,
      initialBalance: Number(this.newAccount.initialBalance)
    };
    this.financeService.createAccount(payload).subscribe({
      next: acc => {
        this.accounts.update(l => [acc, ...l]);
        this.financeService.getSummary().subscribe({ next: d => this.summary.set(d) });
        this.showAccountForm.set(false);
        this.newAccount = { name: '', type: 'CASH', initialBalance: 0 };
        this.toast.success('Cuenta creada');
      },
      error: err => this.toast.error(this.extractError(err, 'Error al crear la cuenta'))
    });
  }

  deleteAccount(id: string): void {
    this.financeService.deleteAccount(id).subscribe({
      next: () => {
        this.accounts.update(l => l.filter(a => a.id !== id));
        this.financeService.getSummary().subscribe({ next: d => this.summary.set(d) });
        this.toast.success('Cuenta eliminada');
      },
      error: () => this.toast.error('Error al eliminar la cuenta')
    });
  }


  submitTransaction(): void {
    if (!this.newTransaction.accountId) { this.toast.warning('Selecciona una cuenta'); return; }
    if (!this.newTransaction.categoryId) { this.toast.warning('Selecciona una categoria'); return; }
    if (Number(this.newTransaction.amount) <= 0) { this.toast.warning('El monto debe ser mayor a 0'); return; }
    const payload = {
      accountId: this.newTransaction.accountId,
      categoryId: this.newTransaction.categoryId,
      amount: Number(this.newTransaction.amount),
      type: this.newTransaction.type,
      description: this.newTransaction.description.trim() || undefined,
      date: this.newTransaction.date
    };
    this.financeService.createTransaction(payload).subscribe({
      next: res => {
        this.transactions.update(l => [res.transaction, ...l]);
        if (res.alert) this.lastAlert.set(res.alert);
        this.refreshSummary();
        this.showTransactionForm.set(false);
        this.newTransaction = {
          accountId: '', categoryId: '', amount: 0,
          type: 'EXPENSE', description: '',
          date: new Date().toISOString().split('T')[0]
        };
        this.toast.success('Transaccion registrada');
      },
      error: err => this.toast.error(this.extractError(err, 'Error al registrar la transaccion'))
    });
  }

  startEditTx(tx: Transaction): void {
    this.editingTxId.set(tx.id);
    this.confirmDeleteTxId.set(null);
    this.editTx = {
      categoryId: tx.categoryId,
      amount: parseFloat(String(tx.amount)),
      type: tx.type as 'INCOME' | 'EXPENSE' | 'TRANSFER',
      description: tx.description ?? '',
      date: new Date(tx.date).toISOString().split('T')[0]
    };
  }

  cancelEditTx(): void { this.editingTxId.set(null); }

  saveEditTx(id: string): void {
    if (Number(this.editTx.amount) <= 0) { this.toast.warning('El monto debe ser mayor a 0'); return; }
    const payload = {
      categoryId: this.editTx.categoryId,
      amount: Number(this.editTx.amount),
      type: this.editTx.type,
      description: this.editTx.description.trim() || undefined,
      date: this.editTx.date
    };
    this.financeService.updateTransaction(id, payload).subscribe({
      next: updated => {
        this.transactions.update(l => l.map(t => t.id === id ? { ...t, ...updated } : t));
        this.editingTxId.set(null);
        this.refreshSummary();
        this.toast.success('Transaccion actualizada');
      },
      error: err => this.toast.error(this.extractError(err, 'Error al actualizar la transaccion'))
    });
  }

  confirmDeleteTx(id: string): void { this.confirmDeleteTxId.set(id); this.editingTxId.set(null); }
  cancelDeleteTx(): void { this.confirmDeleteTxId.set(null); }

  deleteTransaction(id: string): void {
    this.financeService.deleteTransaction(id).subscribe({
      next: () => {
        this.transactions.update(l => l.filter(t => t.id !== id));
        this.confirmDeleteTxId.set(null);
        this.refreshSummary();
        this.toast.success('Transaccion eliminada');
      },
      error: () => this.toast.error('Error al eliminar la transaccion')
    });
  }


  submitBudget(): void {
    if (!this.newBudget.categoryId) { this.toast.warning('Selecciona una categoria'); return; }
    if (Number(this.newBudget.amount) <= 0) { this.toast.warning('El monto debe ser mayor a 0'); return; }
    const now = new Date();
    const payload = {
      categoryId: this.newBudget.categoryId,
      amount: Number(this.newBudget.amount),
      period: this.newBudget.period,
      startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    };
    this.financeService.createBudget(payload).subscribe({
      next: b => {
        this.budgets.update(l => [b, ...l]);
        this.showBudgetForm.set(false);
        this.newBudget = { categoryId: '', amount: 0, period: 'MONTHLY' };
        this.toast.success('Presupuesto creado');
      },
      error: err => this.toast.error(this.extractError(err, 'Error al crear el presupuesto'))
    });
  }

  startEditBudget(b: Budget): void {
    this.editingBudgetId.set(b.id);
    this.confirmDeleteBudgetId.set(null);
    this.editBudgetAmount = Number(b.amount);
  }

  cancelEditBudget(): void { this.editingBudgetId.set(null); }

  saveEditBudget(id: string): void {
    if (this.editBudgetAmount <= 0) { this.toast.warning('El monto debe ser mayor a 0'); return; }
    this.financeService.updateBudget(id, { amount: this.editBudgetAmount }).subscribe({
      next: updated => {
        this.budgets.update(l => l.map(b => b.id === id ? { ...b, ...updated } : b));
        this.editingBudgetId.set(null);
        this.toast.success('Presupuesto actualizado');
      },
      error: err => this.toast.error(this.extractError(err, 'Error al actualizar el presupuesto'))
    });
  }

  confirmDeleteBudget(id: string): void { this.confirmDeleteBudgetId.set(id); this.editingBudgetId.set(null); }
  cancelDeleteBudget(): void { this.confirmDeleteBudgetId.set(null); }

  deleteBudget(id: string): void {
    this.financeService.deleteBudget(id).subscribe({
      next: () => {
        this.budgets.update(l => l.filter(b => b.id !== id));
        this.confirmDeleteBudgetId.set(null);
        this.toast.success('Presupuesto eliminado');
      },
      error: () => this.toast.error('Error al eliminar el presupuesto')
    });
  }


  submitGoal(): void {
    if (!this.newGoal.name.trim()) { this.toast.warning('Ingresa un nombre para la meta'); return; }
    if (Number(this.newGoal.targetAmount) <= 0) { this.toast.warning('El monto objetivo debe ser mayor a 0'); return; }
    const payload = {
      name: this.newGoal.name.trim(),
      targetAmount: Number(this.newGoal.targetAmount),
      deadline: this.newGoal.deadline || undefined
    };
    this.financeService.createGoal(payload).subscribe({
      next: g => {
        this.goals.update(l => [g, ...l]);
        this.showGoalForm.set(false);
        this.newGoal = { name: '', targetAmount: 0, deadline: '' };
        this.toast.success('Meta creada');
      },
      error: err => this.toast.error(this.extractError(err, 'Error al crear la meta'))
    });
  }

  startAddProgress(g: Goal): void {
    this.addingProgressGoalId.set(g.id);
    this.editingGoalId.set(null);
    this.progressAmount = 0;
  }

  cancelAddProgress(): void { this.addingProgressGoalId.set(null); }

  saveProgress(g: Goal): void {
    if (this.progressAmount <= 0) { this.toast.warning('Ingresa un monto mayor a 0'); return; }
    const newCurrent = Number(g.currentAmount) + Number(this.progressAmount);
    this.financeService.updateGoal(g.id, { currentAmount: newCurrent }).subscribe({
      next: updated => {
        this.goals.update(l => l.map(x => x.id === g.id ? { ...x, ...updated } : x));
        this.addingProgressGoalId.set(null);
        this.toast.success(newCurrent >= Number(g.targetAmount) ? 'Meta completada' : 'Progreso guardado');
      },
      error: err => this.toast.error(this.extractError(err, 'Error al guardar el progreso'))
    });
  }

  startEditGoal(g: Goal): void {
    this.editingGoalId.set(g.id);
    this.addingProgressGoalId.set(null);
    this.confirmDeleteGoalId.set(null);
    this.editGoal = {
      name: g.name,
      targetAmount: Number(g.targetAmount),
      deadline: g.deadline ? new Date(g.deadline).toISOString().split('T')[0] : ''
    };
  }

  cancelEditGoal(): void { this.editingGoalId.set(null); }

  saveEditGoal(id: string): void {
    if (!this.editGoal.name.trim()) { this.toast.warning('Ingresa un nombre'); return; }
    if (this.editGoal.targetAmount <= 0) { this.toast.warning('El monto debe ser mayor a 0'); return; }
    const payload = {
      name: this.editGoal.name.trim(),
      targetAmount: this.editGoal.targetAmount,
      deadline: this.editGoal.deadline || undefined
    };
    this.financeService.updateGoal(id, payload).subscribe({
      next: updated => {
        this.goals.update(l => l.map(g => g.id === id ? { ...g, ...updated } : g));
        this.editingGoalId.set(null);
        this.toast.success('Meta actualizada');
      },
      error: err => this.toast.error(this.extractError(err, 'Error al actualizar la meta'))
    });
  }

  confirmDeleteGoal(id: string): void { this.confirmDeleteGoalId.set(id); this.editingGoalId.set(null); }
  cancelDeleteGoal(): void { this.confirmDeleteGoalId.set(null); }

  deleteGoal(id: string): void {
    this.financeService.deleteGoal(id).subscribe({
      next: () => {
        this.goals.update(l => l.filter(g => g.id !== id));
        this.confirmDeleteGoalId.set(null);
        this.toast.success('Meta eliminada');
      },
      error: () => this.toast.error('Error al eliminar la meta')
    });
  }


  computeSpent(categoryId: string): number {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    return this.transactions()
      .filter(t => t.categoryId === categoryId && t.type === 'EXPENSE' && new Date(t.date) >= startOfMonth)
      .reduce((sum, t) => sum + parseFloat(String(t.amount)), 0);
  }

  getBudgetPercent(b: Budget): number {
    const spent = this.computeSpent(b.categoryId);
    return !b.amount ? 0 : Math.min(100, Math.round((spent / Number(b.amount)) * 100));
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
    return !g.targetAmount
      ? 0
      : Math.min(100, Math.round((Number(g.currentAmount) / Number(g.targetAmount)) * 100));
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

  getHealthLabel(s: string): string {
    return ({ HEALTHY: 'Saludable', WARNING: 'Advertencia', DANGER: 'Peligro', CRITICAL: 'Critico' } as any)[s] ?? s;
  }

  getTransactionColor(t: string): string { return t === 'INCOME' ? 'text-emerald-400' : 'text-red-400'; }
  getTransactionSign(t: string): string { return t === 'INCOME' ? '+' : '-'; }

  getAccountTypeLabel(t: string): string {
    return ({ CASH: 'Efectivo', BANK: 'Banco', DIGITAL_WALLET: 'Digital' } as any)[t] ?? t;
  }

  getAccountTypeColor(t: string): string {
    return ({
      CASH: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      BANK: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      DIGITAL_WALLET: 'bg-violet-500/20 text-violet-400 border-violet-500/30'
    } as any)[t] ?? 'bg-slate-500/20 text-slate-400';
  }

  getCategoryName(id: string): string { return this.categories().find(c => c.id === id)?.name ?? 'Sin categoria'; }
  getAccountName(id: string): string { return this.accounts().find(a => a.id === id)?.name ?? 'Cuenta'; }

  private refreshSummary(): void {
    this.financeService.getSummary().subscribe({ next: d => this.summary.set(d) });
    this.financeService.getBudgetHealth().subscribe({ next: d => this.health.set(d) });
  }

  private extractError(err: any, fallback: string): string {
    const msg = err?.error?.message ?? fallback;
    return Array.isArray(msg) ? msg[0] : msg;
  }
  openQuickModal(type: 'INCOME' | 'EXPENSE' | 'TRANSFER' = 'EXPENSE'): void {
    this.quickTxService.open(type);
  }

  private formatDateLabel(dateStr: string): string {
    const todayKey = new Date().toISOString().split('T')[0];
    const yestKey = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dateStr === todayKey) return 'Hoy';
    if (dateStr === yestKey) return 'Ayer';
    const d = new Date(dateStr + 'T12:00:00');
    const label = d.toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
}