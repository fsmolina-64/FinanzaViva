import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../core/services/finance.service';
import { ToastService } from '../../core/services/toast.service';
import { QuickTransactionService } from '../../core/services/quick-transaction.service';
import {
  Account, Transaction, Category, Budget, Goal,
  BudgetHealth, FinanceSummary, TransactionAlert, AccountType,
  CreateTransactionPayload, CreateCategoryPayload, UpdateCategoryPayload
} from '../../core/models/finance.model';

type Tab = 'resumen' | 'transacciones' | 'presupuestos' | 'metas';
type TxTypeFilter = 'ALL' | 'INCOME' | 'EXPENSE';
type TxDateMode = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR';
type ViewMode = 'list' | 'calendar';

@Component({
  selector: 'app-finances',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './finances.html',
  styleUrl: './finances.css'
})
export class Finances implements OnInit {

  // ── GENERAL ──────────────────────────────────────────────────────────────
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

  // ── FORMS: CREAR ─────────────────────────────────────────────────────────
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
  newBudget = { categoryId: '', amount: 0, period: 'MONTHLY' as 'MONTHLY' | 'WEEKLY', months: 1 };
  newGoal = { name: '', targetAmount: 0, deadline: '' };

  // ── EDICION INLINE ────────────────────────────────────────────────────────
  editingTxId = signal<string | null>(null);
  // editTxType como signal para que editTxCategories computed sea reactivo
  editTxType = signal<'INCOME' | 'EXPENSE' | 'TRANSFER'>('EXPENSE');
  editTx = { categoryId: '', amount: 0, description: '', date: '' };
  editingBudgetId = signal<string | null>(null);
  editBudgetAmount = 0;
  editingGoalId = signal<string | null>(null);
  editGoal = { name: '', targetAmount: 0, deadline: '' };

  // ── PROGRESO DE METAS ────────────────────────────────────────────────────
  addingProgressGoalId = signal<string | null>(null);
  progressAmount = 0;
  progressAccountId = '';

  // ── CONFIRMACIONES ELIMINAR ──────────────────────────────────────────────
  confirmDeleteTxId = signal<string | null>(null);
  confirmDeleteBudgetId = signal<string | null>(null);
  confirmDeleteGoalId = signal<string | null>(null);
  confirmDeleteCategoryId = signal<string | null>(null);

  // ── LOADING STATES ───────────────────────────────────────────────────────
  submittingAccount = signal(false);
  submittingTx = signal(false);
  submittingBudget = signal(false);
  submittingGoal = signal(false);

  // ── DEUDA ────────────────────────────────────────────────────────────────
  showDebtConfirm = signal(false);
  private pendingDebtPayload: CreateTransactionPayload | null = null;

  // ── FILTROS TRANSACCIONES (lista) ────────────────────────────────────────
  txFilter = signal<TxTypeFilter>('ALL');
  txDateMode = signal<TxDateMode>('MONTH');
  txMonth = signal(new Date().getMonth());
  txYear = signal(new Date().getFullYear());
  txViewMode = signal<ViewMode>('list');

  // ── CALENDARIO (signals independientes de la lista) ───────────────────────
  calMonth = signal(new Date().getMonth());
  calYear = signal(new Date().getFullYear());
  calTypeFilter = signal<TxTypeFilter>('ALL');
  calendarDayKey = signal<string | null>(null);

  // ── PRESUPUESTO GENERAL (localStorage) ───────────────────────────────────
  globalBudgetLimit = signal<number>(parseFloat(localStorage.getItem('fv_global_budget') ?? '0'));
  showGlobalForm = signal(false);
  newGlobalLimit = 0;

  // ── CATEGORIAS PERSONALIZADAS ────────────────────────────────────────────
  showCategorySection = signal(false);
  showCategoryForm = signal(false);
  editingCategoryId = signal<string | null>(null);
  newCategory = { name: '', type: 'EXPENSE' as 'INCOME' | 'EXPENSE' };
  editCategory = { name: '' };

  // ── CONSTANTES ───────────────────────────────────────────────────────────
  readonly monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  readonly weekDays = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

  readonly tabs: { key: Tab; label: string }[] = [
    { key: 'resumen', label: 'Resumen' },
    { key: 'transacciones', label: 'Transacciones' },
    { key: 'presupuestos', label: 'Presupuestos' },
    { key: 'metas', label: 'Metas' }
  ];

  // ── COMPUTED ─────────────────────────────────────────────────────────────
  expenseCategories = computed(() => this.categories().filter(c => c.type === 'EXPENSE'));

  filteredCategories = computed(() => {
    const t = this.newTransaction.type;
    if (t === 'INCOME') return this.categories().filter(c => c.type === 'INCOME');
    if (t === 'EXPENSE') return this.categories().filter(c => c.type === 'EXPENSE');
    return this.categories();
  });

  // Lee editTxType (signal) para ser reactivo al cambio de tipo
  editTxCategories = computed(() => {
    const t = this.editTxType();
    if (t === 'INCOME') return this.categories().filter(c => c.type === 'INCOME');
    if (t === 'EXPENSE') return this.categories().filter(c => c.type === 'EXPENSE');
    return this.categories();
  });

  userCategories = computed(() => this.categories().filter(c => !c.isGlobal));
  globalCategories = computed(() => this.categories().filter(c => c.isGlobal));

  filteredTransactions = computed(() => {
    let txs = this.transactions();
    const typeF = this.txFilter();
    if (typeF !== 'ALL') txs = txs.filter(t => t.type === typeF);

    const mode = this.txDateMode();
    const m = this.txMonth();
    const y = this.txYear();
    const now = new Date();

    if (mode === 'TODAY') {
      const key = now.toISOString().split('T')[0];
      txs = txs.filter(t => t.date.substring(0, 10) === key);
    } else if (mode === 'WEEK') {
      const ago = new Date(now.getTime() - 7 * 86400000);
      txs = txs.filter(t => new Date(t.date.substring(0, 10) + 'T12:00:00') >= ago);
    } else if (mode === 'MONTH') {
      txs = txs.filter(t => {
        const d = new Date(t.date.substring(0, 10) + 'T12:00:00');
        return d.getMonth() === m && d.getFullYear() === y;
      });
    } else if (mode === 'YEAR') {
      txs = txs.filter(t => new Date(t.date.substring(0, 10) + 'T12:00:00').getFullYear() === y);
    }

    return txs;
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

  // calendarCells usa calMonth/calYear y respeta calTypeFilter para los totales
  calendarCells = computed(() => {
    const y = this.calYear();
    const m = this.calMonth();
    const typeF = this.calTypeFilter();
    const firstDay = new Date(y, m, 1).getDay();
    const lastDate = new Date(y, m + 1, 0).getDate();

    const cells: { date: string | null; income: number; expense: number; count: number }[] = [];
    for (let i = 0; i < firstDay; i++) cells.push({ date: null, income: 0, expense: 0, count: 0 });

    for (let d = 1; d <= lastDate; d++) {
      const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const allDayTx = this.transactions().filter(t => t.date.substring(0, 10) === key);
      const filtered = typeF === 'ALL' ? allDayTx : allDayTx.filter(t => t.type === typeF);
      cells.push({
        date: key,
        income: filtered.filter(t => t.type === 'INCOME').reduce((s, t) => s + parseFloat(String(t.amount)), 0),
        expense: filtered.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + parseFloat(String(t.amount)), 0),
        count: filtered.length
      });
    }
    return cells;
  });

  // calendarDayTxs respeta calTypeFilter para el modal del dia
  calendarDayTxs = computed(() => {
    const key = this.calendarDayKey();
    if (!key) return [];
    const typeF = this.calTypeFilter();
    return this.transactions().filter(t => {
      if (t.date.substring(0, 10) !== key) return false;
      if (typeF === 'ALL') return true;
      return t.type === typeF;
    });
  });

  globalBudgetPct = computed(() => {
    const limit = this.globalBudgetLimit();
    const h = this.health();
    if (!limit || !h) return 0;
    return Math.min(100, Math.round((h.expenses / limit) * 100));
  });

  // ── CONSTRUCTOR ───────────────────────────────────────────────────────────
  constructor(
    private financeService: FinanceService,
    private toast: ToastService,
    private quickTxService: QuickTransactionService
  ) {
    effect(() => {
      const res = this.quickTxService.lastCreated();
      if (!res) return;
      if (this.transactions().some(t => t.id === res.transaction.id)) return;
      this.transactions.update(l => [res.transaction, ...l]);
      if (res.alert) this.lastAlert.set(res.alert);
      this.refreshSummary();
    });

    effect(() => {
      const tick = this.quickTxService.reloadTick();
      if (tick === 0) return;
      this.reloadAll();
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
  openQuickModal(type: 'INCOME' | 'EXPENSE' | 'TRANSFER' = 'EXPENSE') { this.quickTxService.open(type); }

  // ── CUENTAS ───────────────────────────────────────────────────────────────
  submitAccount(): void {
    if (!this.newAccount.name.trim()) { this.toast.warning('Ingresa un nombre'); return; }
    this.submittingAccount.set(true);
    this.financeService.createAccount({
      name: this.newAccount.name.trim(), type: this.newAccount.type, initialBalance: Number(this.newAccount.initialBalance)
    }).subscribe({
      next: acc => {
        this.accounts.update(l => [acc, ...l]);
        this.refreshSummary();
        this.showAccountForm.set(false);
        this.newAccount = { name: '', type: 'CASH', initialBalance: 0 };
        this.submittingAccount.set(false);
        this.toast.success('Cuenta creada');
      },
      error: err => { this.toast.error(this.extractError(err, 'Error al crear la cuenta')); this.submittingAccount.set(false); }
    });
  }

  deleteAccount(id: string): void {
    this.financeService.deleteAccount(id).subscribe({
      next: () => { this.accounts.update(l => l.filter(a => a.id !== id)); this.refreshSummary(); this.toast.success('Cuenta eliminada'); },
      error: err => this.toast.error(this.extractError(err, 'Error al eliminar la cuenta'))
    });
  }

  // ── TRANSACCIONES ─────────────────────────────────────────────────────────
  submitTransaction(): void {
    if (!this.newTransaction.accountId) { this.toast.warning('Selecciona una cuenta'); return; }
    if (!this.newTransaction.categoryId) { this.toast.warning('Selecciona una categoria'); return; }
    if (Number(this.newTransaction.amount) <= 0) { this.toast.warning('El monto debe ser mayor a 0'); return; }
    const payload: CreateTransactionPayload = {
      accountId: this.newTransaction.accountId,
      categoryId: this.newTransaction.categoryId,
      amount: Number(this.newTransaction.amount),
      type: this.newTransaction.type,
      description: this.newTransaction.description.trim() || undefined,
      date: this.newTransaction.date
    };
    if (payload.type === 'EXPENSE') {
      const balance = parseFloat(String(this.accounts().find(a => a.id === payload.accountId)?.balance ?? '0'));
      if (payload.amount > balance) { this.pendingDebtPayload = payload; this.showDebtConfirm.set(true); return; }
    }
    this.executeTransaction(payload);
  }

  confirmDebt(): void {
    if (!this.pendingDebtPayload) return;
    this.executeTransaction({ ...this.pendingDebtPayload, allowNegative: true });
    this.showDebtConfirm.set(false);
    this.pendingDebtPayload = null;
  }

  cancelDebt(): void { this.showDebtConfirm.set(false); this.pendingDebtPayload = null; }

  private executeTransaction(payload: CreateTransactionPayload): void {
    this.submittingTx.set(true);
    this.financeService.createTransaction(payload).subscribe({
      next: res => {
        this.transactions.update(l => [res.transaction, ...l]);
        if (res.alert) this.lastAlert.set(res.alert);
        this.refreshSummary();
        this.showTransactionForm.set(false);
        this.newTransaction = { accountId: '', categoryId: '', amount: 0, type: 'EXPENSE', description: '', date: new Date().toISOString().split('T')[0] };
        this.submittingTx.set(false);
        this.toast.success('Transaccion registrada');
      },
      error: err => { this.toast.error(this.extractError(err, 'Error al registrar la transaccion')); this.submittingTx.set(false); }
    });
  }

  startEditTx(tx: Transaction): void {
    this.editingTxId.set(tx.id);
    this.confirmDeleteTxId.set(null);
    this.editTxType.set(tx.type as 'INCOME' | 'EXPENSE' | 'TRANSFER');
    this.editTx = {
      categoryId: tx.categoryId,
      amount: parseFloat(String(tx.amount)),
      description: tx.description ?? '',
      date: new Date(tx.date).toISOString().split('T')[0]
    };
  }

  cancelEditTx(): void { this.editingTxId.set(null); }

  // Actualiza signal reactivo Y objeto plano sincronizados; resetea categoría para forzar selección válida
  onEditTxTypeChange(t: 'INCOME' | 'EXPENSE' | 'TRANSFER'): void {
    this.editTxType.set(t);
    this.editTx.categoryId = '';
  }

  saveEditTx(id: string): void {
    if (Number(this.editTx.amount) <= 0) { this.toast.warning('El monto debe ser mayor a 0'); return; }
    this.financeService.updateTransaction(id, {
      categoryId: this.editTx.categoryId,
      amount: Number(this.editTx.amount),
      type: this.editTxType(),
      description: this.editTx.description.trim() || undefined,
      date: this.editTx.date
    }).subscribe({
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
        this.calendarDayKey.set(null); // cierra modal si estaba abierto
        this.refreshSummary();
        this.toast.success('Transaccion eliminada');
      },
      error: () => this.toast.error('Error al eliminar la transaccion')
    });
  }

  // ── FILTROS / CALENDARIO ──────────────────────────────────────────────────
  setViewMode(mode: ViewMode): void {
    this.txViewMode.set(mode);
    if (mode === 'calendar') {
      // Sincroniza el calendario al mes activo de la lista si está en modo MES
      this.calMonth.set(this.txDateMode() === 'MONTH' ? this.txMonth() : new Date().getMonth());
      this.calYear.set(this.txDateMode() === 'MONTH' ? this.txYear() : new Date().getFullYear());
    }
  }

  prevMonth(): void {
    if (this.txViewMode() === 'calendar') {
      const m = this.calMonth();
      if (m === 0) { this.calMonth.set(11); this.calYear.update(y => y - 1); }
      else this.calMonth.update(v => v - 1);
    } else {
      this.txDateMode.set('MONTH');
      const m = this.txMonth();
      if (m === 0) { this.txMonth.set(11); this.txYear.update(y => y - 1); }
      else this.txMonth.update(v => v - 1);
    }
  }

  nextMonth(): void {
    if (this.txViewMode() === 'calendar') {
      const m = this.calMonth();
      if (m === 11) { this.calMonth.set(0); this.calYear.update(y => y + 1); }
      else this.calMonth.update(v => v + 1);
    } else {
      this.txDateMode.set('MONTH');
      const m = this.txMonth();
      if (m === 11) { this.txMonth.set(0); this.txYear.update(y => y + 1); }
      else this.txMonth.update(v => v + 1);
    }
  }

  openCalendarDay(key: string): void { this.calendarDayKey.set(key); }
  closeCalendarDay(): void { this.calendarDayKey.set(null); }

  getDay(dateKey: string): string { return String(parseInt(dateKey.substring(8))); }
  isToday(dateKey: string): boolean { return dateKey === new Date().toISOString().split('T')[0]; }

  // ── PRESUPUESTOS ──────────────────────────────────────────────────────────
  submitBudget(): void {
    if (!this.newBudget.categoryId) { this.toast.warning('Selecciona una categoria'); return; }
    if (Number(this.newBudget.amount) <= 0) { this.toast.warning('El monto debe ser mayor a 0'); return; }
    const now = new Date();
    const months = Math.max(1, this.newBudget.months);
    const payload = {
      categoryId: this.newBudget.categoryId,
      amount: Number(this.newBudget.amount),
      period: this.newBudget.period,
      startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
      endDate: new Date(now.getFullYear(), now.getMonth() + months, 0).toISOString().split('T')[0]
    };
    this.submittingBudget.set(true);
    this.financeService.createBudget(payload).subscribe({
      next: b => { this.budgets.update(l => [b, ...l]); this.showBudgetForm.set(false); this.newBudget = { categoryId: '', amount: 0, period: 'MONTHLY', months: 1 }; this.submittingBudget.set(false); this.toast.success('Presupuesto creado'); },
      error: err => { this.toast.error(this.extractError(err, 'Error al crear el presupuesto')); this.submittingBudget.set(false); }
    });
  }

  startEditBudget(b: Budget): void { this.editingBudgetId.set(b.id); this.confirmDeleteBudgetId.set(null); this.editBudgetAmount = Number(b.amount); }
  cancelEditBudget(): void { this.editingBudgetId.set(null); }

  saveEditBudget(id: string): void {
    if (this.editBudgetAmount <= 0) { this.toast.warning('El monto debe ser mayor a 0'); return; }
    this.financeService.updateBudget(id, { amount: this.editBudgetAmount }).subscribe({
      next: updated => { this.budgets.update(l => l.map(b => b.id === id ? { ...b, ...updated } : b)); this.editingBudgetId.set(null); this.toast.success('Presupuesto actualizado'); },
      error: err => this.toast.error(this.extractError(err, 'Error al actualizar el presupuesto'))
    });
  }

  confirmDeleteBudget(id: string): void { this.confirmDeleteBudgetId.set(id); this.editingBudgetId.set(null); }
  cancelDeleteBudget(): void { this.confirmDeleteBudgetId.set(null); }

  deleteBudget(id: string): void {
    this.financeService.deleteBudget(id).subscribe({
      next: () => { this.budgets.update(l => l.filter(b => b.id !== id)); this.confirmDeleteBudgetId.set(null); this.toast.success('Presupuesto eliminado'); },
      error: () => this.toast.error('Error al eliminar el presupuesto')
    });
  }

  saveGlobalBudget(): void {
    if (this.newGlobalLimit <= 0) { this.toast.warning('Ingresa un monto mayor a 0'); return; }
    this.globalBudgetLimit.set(this.newGlobalLimit);
    localStorage.setItem('fv_global_budget', String(this.newGlobalLimit));
    this.showGlobalForm.set(false);
    this.toast.success('Presupuesto general guardado');
  }

  clearGlobalBudget(): void {
    this.globalBudgetLimit.set(0);
    localStorage.removeItem('fv_global_budget');
    this.toast.info('Presupuesto general eliminado');
  }

  // ── CATEGORIAS ────────────────────────────────────────────────────────────
  submitCategory(): void {
    if (!this.newCategory.name.trim()) { this.toast.warning('Ingresa un nombre'); return; }
    this.financeService.createCategory({
      name: this.newCategory.name.trim(),
      type: this.newCategory.type
    }).subscribe({
      next: cat => {
        this.categories.update(l => [...l, cat].sort((a, b) => a.name.localeCompare(b.name)));
        this.showCategoryForm.set(false);
        this.newCategory = { name: '', type: 'EXPENSE' };
        this.toast.success('Categoria creada');
      },
      error: err => this.toast.error(this.extractError(err, 'Error al crear la categoria'))
    });
  }

  startEditCategory(cat: Category): void {
    this.editingCategoryId.set(cat.id);
    this.confirmDeleteCategoryId.set(null);
    this.editCategory = { name: cat.name };
  }
  cancelEditCategory(): void { this.editingCategoryId.set(null); }

  saveEditCategory(id: string): void {
    if (!this.editCategory.name.trim()) { this.toast.warning('Ingresa un nombre'); return; }
    this.financeService.updateCategory(id, { name: this.editCategory.name.trim() }).subscribe({
      next: updated => {
        this.categories.update(l => l.map(c => c.id === id ? { ...c, ...updated } : c));
        this.editingCategoryId.set(null);
        this.toast.success('Categoria actualizada');
      },
      error: err => this.toast.error(this.extractError(err, 'Error al actualizar la categoria'))
    });
  }

  confirmDeleteCategory(id: string): void { this.confirmDeleteCategoryId.set(id); this.editingCategoryId.set(null); }
  cancelDeleteCategory(): void { this.confirmDeleteCategoryId.set(null); }

  deleteCategory(id: string): void {
    this.financeService.deleteCategory(id).subscribe({
      next: () => {
        this.categories.update(l => l.filter(c => c.id !== id));
        this.confirmDeleteCategoryId.set(null);
        this.toast.success('Categoria eliminada');
      },
      error: err => this.toast.error(this.extractError(err, 'Error al eliminar la categoria'))
    });
  }

  // ── METAS ─────────────────────────────────────────────────────────────────
  submitGoal(): void {
    if (!this.newGoal.name.trim()) { this.toast.warning('Ingresa un nombre para la meta'); return; }
    if (Number(this.newGoal.targetAmount) <= 0) { this.toast.warning('El monto objetivo debe ser mayor a 0'); return; }
    this.submittingGoal.set(true);
    this.financeService.createGoal({ name: this.newGoal.name.trim(), targetAmount: Number(this.newGoal.targetAmount), deadline: this.newGoal.deadline || undefined }).subscribe({
      next: g => { this.goals.update(l => [g, ...l]); this.showGoalForm.set(false); this.newGoal = { name: '', targetAmount: 0, deadline: '' }; this.submittingGoal.set(false); this.toast.success('Meta creada'); },
      error: err => { this.toast.error(this.extractError(err, 'Error al crear la meta')); this.submittingGoal.set(false); }
    });
  }

  startAddProgress(g: Goal): void {
    this.addingProgressGoalId.set(g.id); this.editingGoalId.set(null);
    this.progressAmount = 0;
    this.progressAccountId = this.accounts().find(a => parseFloat(String(a.balance)) > 0)?.id ?? '';
  }
  cancelAddProgress(): void { this.addingProgressGoalId.set(null); }

  saveProgress(g: Goal): void {
    if (this.progressAmount <= 0) { this.toast.warning('Ingresa un monto mayor a 0'); return; }
    if (!this.progressAccountId) { this.toast.warning('Selecciona una cuenta'); return; }
    const account = this.accounts().find(a => a.id === this.progressAccountId);
    if (!account) { this.toast.warning('Cuenta no encontrada'); return; }
    const balance = parseFloat(String(account.balance));
    if (this.progressAmount > balance) {
      this.toast.error(`Saldo insuficiente en ${account.name}. Disponible: ${this.formatCurrency(balance)}`);
      return;
    }
    const newCurrent = Number(g.currentAmount) + Number(this.progressAmount);
    this.financeService.updateGoal(g.id, { currentAmount: newCurrent, fromAccountId: this.progressAccountId }).subscribe({
      next: updated => {
        this.goals.update(l => l.map(x => x.id === g.id ? { ...x, ...updated } : x));
        const deducted = Number(this.progressAmount);
        this.accounts.update(accs => accs.map(a => a.id === this.progressAccountId ? { ...a, balance: String(parseFloat(String(a.balance)) - deducted) } : a));
        this.financeService.getSummary().subscribe({ next: d => this.summary.set(d) });
        this.addingProgressGoalId.set(null);
        this.progressAccountId = '';
        this.toast.success(newCurrent >= Number(g.targetAmount) ? 'Meta completada' : 'Ahorro registrado');
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
      targetAmount: parseFloat(String(g.targetAmount)),
      deadline: g.deadline ? new Date(g.deadline).toISOString().split('T')[0] : ''
    };
  }
  cancelEditGoal(): void { this.editingGoalId.set(null); }

  saveEditGoal(id: string): void {
    if (!this.editGoal.name.trim()) { this.toast.warning('Ingresa un nombre'); return; }
    if (Number(this.editGoal.targetAmount) <= 0) { this.toast.warning('El monto debe ser mayor a 0'); return; }
    this.financeService.updateGoal(id, {
      name: this.editGoal.name.trim(),
      targetAmount: Number(this.editGoal.targetAmount),
      deadline: this.editGoal.deadline || undefined
    }).subscribe({
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

  // ── UTILIDADES ────────────────────────────────────────────────────────────
  formatCurrency(value: number | string): string {
    const n = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(n)) return '0,00';
    return new Intl.NumberFormat('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  }

  formatDateLabel(dateKey: string): string {
    const d = new Date(dateKey + 'T12:00:00');
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dateKey === today) return 'Hoy';
    if (dateKey === yesterday) return 'Ayer';
    return d.toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  getCategoryName(categoryId: string): string {
    return this.categories().find(c => c.id === categoryId)?.name ?? 'Sin categoria';
  }

  getTransactionBg(type: string): string {
    if (type === 'INCOME') return 'bg-emerald-500/20 text-emerald-400';
    if (type === 'TRANSFER') return 'bg-blue-500/20 text-blue-400';
    return 'bg-red-500/20 text-red-400';
  }

  getTransactionColor(type: string): string {
    if (type === 'INCOME') return 'text-emerald-400';
    if (type === 'TRANSFER') return 'text-blue-400';
    return 'text-red-400';
  }

  getTransactionSign(type: string): string {
    if (type === 'INCOME') return '+$';
    if (type === 'TRANSFER') return '$';
    return '-$';
  }

  getAccountTypeLabel(type: AccountType): string {
    const map: Record<AccountType, string> = { CASH: 'Efectivo', BANK: 'Banco', DIGITAL_WALLET: 'Billetera' };
    return map[type] ?? type;
  }

  getAccountTypeColor(type: AccountType): string {
    if (type === 'CASH') return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (type === 'BANK') return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
  }

  computeSpent(categoryId: string): number {
    const now = new Date();
    return this.transactions()
      .filter(t =>
        t.type === 'EXPENSE' &&
        t.categoryId === categoryId &&
        new Date(t.date).getMonth() === now.getMonth() &&
        new Date(t.date).getFullYear() === now.getFullYear()
      )
      .reduce((s, t) => s + parseFloat(String(t.amount)), 0);
  }

  getBudgetPct(b: Budget): number {
    const spent = this.computeSpent(b.categoryId);
    const amount = parseFloat(String(b.amount));
    if (!amount) return 0;
    return Math.min(100, Math.round((spent / amount) * 100));
  }

  getGoalProgress(g: Goal): number {
    const current = parseFloat(String(g.currentAmount));
    const target = parseFloat(String(g.targetAmount));
    if (!target) return 0;
    return Math.min(100, Math.round((current / target) * 100));
  }

  extractError(err: any, fallback: string): string {
    return err?.error?.message ?? fallback;
  }

  refreshSummary(): void {
    this.financeService.getSummary().subscribe({ next: d => this.summary.set(d) });
    this.financeService.getBudgetHealth().subscribe({ next: d => this.health.set(d) });
  }

  reloadAll(): void {
    this.loading.set(true);
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
}