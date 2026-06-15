import { Component, OnInit, signal, computed, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../core/services/finance.service';
import { ToastService } from '../../core/services/toast.service';
import { QuickTransactionService } from '../../core/services/quick-transaction.service';
import {
  Account, Transaction, Category, Budget, Goal,
  BudgetHealth, FinanceSummary, TransactionAlert, AccountType,
  CreateTransactionPayload, CreateCategoryPayload
} from '../../core/models/finance.model';

type Tab = 'resumen' | 'transacciones' | 'presupuestos' | 'metas';
type TxTypeFilter = 'ALL' | 'INCOME' | 'EXPENSE';
type TxDateMode = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR';
type ViewMode = 'list' | 'calendar';
type Recurrence = 'NONE' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'YEARLY';

interface RecurringRule {
  id: string;
  accountId: string;
  categoryId: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  description?: string;
  recurrence: Exclude<Recurrence, 'NONE'>;
  nextDate: string;   // YYYY-MM-DD
}

@Component({
  selector: 'app-finances',
  standalone: true,
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
    description: '', date: new Date().toISOString().split('T')[0],
    recurrence: 'NONE' as Recurrence
  };

  newBudget = { categoryId: '', amount: 0, period: 'MONTHLY' as 'MONTHLY' | 'WEEKLY', months: 1 };
  newGoal = { name: '', targetAmount: 0, deadline: '' };

  // ── EDICION TRANSACCION ───────────────────────────────────────────────────
  editingTxId = signal<string | null>(null);
  editTxType = signal<'INCOME' | 'EXPENSE' | 'TRANSFER'>('EXPENSE');   // signal reactivo para computed
  editTx = { categoryId: '', amount: 0, description: '', date: '', accountId: '' };

  showEditDebtConfirm = signal(false);
  pendingEditId = signal<string | null>(null);

  // ── EDICION PRESUPUESTO ───────────────────────────────────────────────────
  editingBudgetId = signal<string | null>(null);
  editBudget = { amount: 0, period: 'MONTHLY' as 'MONTHLY' | 'WEEKLY', indefinido: false, months: 1 };
  get editBudgetAmount(): number { return this.editBudget.amount; }
  set editBudgetAmount(v: number) { this.editBudget.amount = v; }

  // ── EDICION META ──────────────────────────────────────────────────────────
  editingGoalId = signal<string | null>(null);
  editGoal = { name: '', targetAmount: 0, deadline: '' };
  addingProgressGoalId = signal<string | null>(null);
  progressAmount = 0;
  progressAccountId = '';

  // ── EDICION CATEGORIA ─────────────────────────────────────────────────────
  showCategorySection = signal(false);
  showCategoryForm = signal(false);
  editingCategoryId = signal<string | null>(null);
  newCategory = { name: '', type: 'EXPENSE' as 'INCOME' | 'EXPENSE' };
  editCategory = { name: '' };

  // ── CONFIRMACIONES ELIMINAR ───────────────────────────────────────────────
  confirmDeleteTxId = signal<string | null>(null);
  confirmDeleteBudgetId = signal<string | null>(null);
  confirmDeleteGoalId = signal<string | null>(null);
  confirmDeleteCategoryId = signal<string | null>(null);

  // ── LOADING STATES ────────────────────────────────────────────────────────
  submittingAccount = signal(false);
  submittingTx = signal(false);
  submittingBudget = signal(false);
  submittingGoal = signal(false);

  // ── DEUDA ─────────────────────────────────────────────────────────────────
  showDebtConfirm = signal(false);
  private pendingDebtPayload: CreateTransactionPayload | null = null;

  // ── FILTROS LISTA ─────────────────────────────────────────────────────────
  txFilter = signal<TxTypeFilter>('ALL');
  txDateMode = signal<TxDateMode>('MONTH');
  txMonth = signal(new Date().getMonth());
  txYear = signal(new Date().getFullYear());
  txViewMode = signal<ViewMode>('list');

  // ── FILTROS CALENDARIO (independientes de la lista) ───────────────────────
  calMonth = signal(new Date().getMonth());
  calYear = signal(new Date().getFullYear());
  calTypeFilter = signal<TxTypeFilter>('ALL');
  calendarDayKey = signal<string | null>(null);

  // ── PRESUPUESTO GENERAL ───────────────────────────────────────────────────
  globalBudgetLimit = signal<number>(parseFloat(localStorage.getItem('fv_global_budget') ?? '0'));
  showGlobalForm = signal(false);
  newGlobalLimit = 0;

  // ── REGLAS RECURRENTES (localStorage) ────────────────────────────────────
  private readonly RECURRING_KEY = 'fv_recurring';
  recurringRules = signal<RecurringRule[]>(this.loadRecurring());

  // ── CONSTANTES ────────────────────────────────────────────────────────────
  readonly monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  readonly weekDays = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  readonly tabs: { key: Tab; label: string }[] = [
    { key: 'resumen', label: 'Resumen' },
    { key: 'transacciones', label: 'Transacciones' },
    { key: 'presupuestos', label: 'Presupuestos' },
    { key: 'metas', label: 'Metas' }
  ];
  readonly recurrenceOptions = [
    { value: 'NONE', label: 'No repetir' },
    { value: 'WEEKLY', label: 'Cada semana' },
    { value: 'BIWEEKLY', label: 'Cada 2 semanas' },
    { value: 'MONTHLY', label: 'Cada mes' },
    { value: 'YEARLY', label: 'Cada ano' },
  ];

  // ── COMPUTED ──────────────────────────────────────────────────────────────
  expenseCategories = computed(() => this.categories().filter(c => c.type === 'EXPENSE'));
  userCategories = computed(() => this.categories().filter(c => !c.isGlobal));
  globalCategories = computed(() => this.categories().filter(c => c.isGlobal));

  filteredCategories = computed(() => {
    const t = this.newTransaction.type;
    if (t === 'INCOME') return this.categories().filter(c => c.type === 'INCOME');
    if (t === 'EXPENSE') return this.categories().filter(c => c.type === 'EXPENSE');
    return this.categories();
  });

  // Lee editTxType como signal — el computed se recalcula cuando el tipo cambia
  editTxCategories = computed(() => {
    const t = this.editTxType();
    if (t === 'INCOME') return this.categories().filter(c => c.type === 'INCOME');
    if (t === 'EXPENSE') return this.categories().filter(c => c.type === 'EXPENSE');
    return this.categories();
  });

  filteredTransactions = computed(() => {
    let txs = this.transactions();
    const typeF = this.txFilter();
    if (typeF !== 'ALL') txs = txs.filter(t => t.type === typeF);
    const mode = this.txDateMode();
    const m = this.txMonth(), y = this.txYear();
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

  calendarCells = computed(() => {
    const y = this.calYear(), m = this.calMonth();
    const typeF = this.calTypeFilter();
    const firstDay = new Date(y, m, 1).getDay();
    const lastDate = new Date(y, m + 1, 0).getDate();
    const cells: { date: string | null; income: number; expense: number; count: number }[] = [];
    for (let i = 0; i < firstDay; i++) cells.push({ date: null, income: 0, expense: 0, count: 0 });
    for (let d = 1; d <= lastDate; d++) {
      const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const day = this.transactions().filter(t => t.date.substring(0, 10) === key);
      const vis = typeF === 'ALL' ? day : day.filter(t => t.type === typeF);
      cells.push({
        date: key,
        income: vis.filter(t => t.type === 'INCOME').reduce((s, t) => s + parseFloat(String(t.amount)), 0),
        expense: vis.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + parseFloat(String(t.amount)), 0),
        count: vis.length
      });
    }
    return cells;
  });

  calendarDayTxs = computed(() => {
    const key = this.calendarDayKey();
    if (!key) return [];
    const typeF = this.calTypeFilter();
    return this.transactions().filter(t => {
      if (t.date.substring(0, 10) !== key) return false;
      return typeF === 'ALL' || t.type === typeF;
    });
  });

  globalBudgetPct = computed(() => {
    const limit = this.globalBudgetLimit(), h = this.health();
    if (!limit || !h) return 0;
    return Math.min(100, Math.round((h.expenses / limit) * 100));
  });

  pendingRecurring = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.recurringRules().filter(r => r.nextDate <= today);
  });

  // ── CONSTRUCTOR ───────────────────────────────────────────────────────────
  constructor(
    private financeService: FinanceService,
    private toast: ToastService,
    private quickTxService: QuickTransactionService
  ) {
    // Effect 1: sincronizar con QuickModal
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

    // Effect 2: cerrar edicion al cambiar cualquier filtro (Fix #4)
    effect(() => {
      this.txFilter(); this.txDateMode(); this.txViewMode();
      this.calTypeFilter(); this.calMonth(); this.calYear();
      this.txMonth(); this.txYear();
      untracked(() => {
        this.editingTxId.set(null);
        this.confirmDeleteTxId.set(null);
        this.editingBudgetId.set(null);
        this.confirmDeleteBudgetId.set(null);
      });
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
      name: this.newAccount.name.trim(), type: this.newAccount.type,
      initialBalance: Number(this.newAccount.initialBalance)
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

  // ── TRANSACCIONES — CREAR ─────────────────────────────────────────────────
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

        // Guardar regla recurrente si aplica
        const rec = this.newTransaction.recurrence;
        if (rec !== 'NONE' && payload.type !== 'TRANSFER') {
          const rule: RecurringRule = {
            id: crypto.randomUUID(),
            accountId: payload.accountId,
            categoryId: payload.categoryId,
            amount: payload.amount,
            type: payload.type as 'INCOME' | 'EXPENSE',
            description: payload.description,
            recurrence: rec as Exclude<Recurrence, 'NONE'>,
            nextDate: this.calcNextDate(payload.date, rec)
          };
          this.recurringRules.update(r => [...r, rule]);
          this.saveRecurring(this.recurringRules());
          this.toast.success('Transaccion registrada y regla recurrente guardada');
        } else {
          this.toast.success('Transaccion registrada');
        }

        this.refreshSummary();
        this.showTransactionForm.set(false);
        this.newTransaction = {
          accountId: '', categoryId: '', amount: 0, type: 'EXPENSE',
          description: '', date: new Date().toISOString().split('T')[0], recurrence: 'NONE'
        };
        this.submittingTx.set(false);
      },
      error: err => { this.toast.error(this.extractError(err, 'Error al registrar')); this.submittingTx.set(false); }
    });
  }

  // ── TRANSACCIONES — EDITAR ────────────────────────────────────────────────
  startEditTx(tx: Transaction): void {
    if (tx.type === 'TRANSFER') {
      this.toast.warning('Las transferencias no se pueden editar. Eliminalas y vuelve a crearlas.');
      return;
    }
    this.editingTxId.set(tx.id);
    this.confirmDeleteTxId.set(null);
    this.editTxType.set(tx.type as 'INCOME' | 'EXPENSE' | 'TRANSFER');
    this.editTx = {
      categoryId: tx.categoryId,
      amount: parseFloat(String(tx.amount)),
      description: tx.description ?? '',
      date: new Date(tx.date).toISOString().split('T')[0],
      accountId: tx.accountId
    };
  }
  cancelEditTx(): void { this.editingTxId.set(null); }

  onEditTxTypeChange(t: 'INCOME' | 'EXPENSE' | 'TRANSFER'): void {
    this.editTxType.set(t);
    this.editTx.categoryId = '';   // resetear para forzar seleccion valida
  }

  saveEditTx(id: string): void {
    if (Number(this.editTx.amount) <= 0) { this.toast.warning('El monto debe ser mayor a 0'); return; }
    if (!this.editTx.accountId) { this.toast.warning('Selecciona una cuenta'); return; }

    // Verificar deuda en edicion
    if (this.editTxType() === 'EXPENSE') {
      const acc = this.accounts().find(a => a.id === this.editTx.accountId);
      const balance = parseFloat(String(acc?.balance ?? '0'));
      if (Number(this.editTx.amount) > balance) {
        this.pendingEditId.set(id);
        this.showEditDebtConfirm.set(true);
        return;
      }
    }
    this.executeEditTx(id, false);
  }

  confirmEditDebt(): void {
    const id = this.pendingEditId();
    if (!id) return;
    this.executeEditTx(id, true);
    this.showEditDebtConfirm.set(false);
    this.pendingEditId.set(null);
  }
  cancelEditDebt(): void { this.showEditDebtConfirm.set(false); this.pendingEditId.set(null); }

  private executeEditTx(id: string, allowNegative: boolean): void {
    this.financeService.updateTransaction(id, {
      accountId: this.editTx.accountId,
      categoryId: this.editTx.categoryId || undefined,
      amount: Number(this.editTx.amount),
      type: this.editTxType(),
      description: this.editTx.description.trim() || undefined,
      date: this.editTx.date,
      allowNegative
    }).subscribe({
      next: updated => {
        this.transactions.update(l => l.map(t => t.id === id ? { ...t, ...updated } : t));
        this.editingTxId.set(null);
        // Recargar cuentas porque los balances cambiaron
        this.financeService.getAccounts().subscribe({ next: d => this.accounts.set(d) });
        this.refreshSummary();
        this.toast.success('Transaccion actualizada');
      },
      error: err => this.toast.error(this.extractError(err, 'Error al actualizar'))
    });
  }

  // ── TRANSACCIONES — ELIMINAR ──────────────────────────────────────────────
  confirmDeleteTx(id: string): void { this.confirmDeleteTxId.set(id); this.editingTxId.set(null); }
  cancelDeleteTx(): void { this.confirmDeleteTxId.set(null); }

  deleteTransaction(id: string): void {
    this.financeService.deleteTransaction(id).subscribe({
      next: () => {
        this.transactions.update(l => l.filter(t => t.id !== id));
        this.confirmDeleteTxId.set(null);
        this.calendarDayKey.set(null);
        this.refreshSummary();
        this.toast.success('Transaccion eliminada');
      },
      error: () => this.toast.error('Error al eliminar la transaccion')
    });
  }

  // ── CALENDARIO ────────────────────────────────────────────────────────────
  setViewMode(mode: ViewMode): void {
    this.txViewMode.set(mode);
    if (mode === 'calendar') {
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
  closeCalendarDay(): void { this.calendarDayKey.set(null); this.editingTxId.set(null); this.confirmDeleteTxId.set(null); }
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
      next: b => {
        this.budgets.update(l => [b, ...l]);
        this.showBudgetForm.set(false);
        this.newBudget = { categoryId: '', amount: 0, period: 'MONTHLY', months: 1 };
        this.submittingBudget.set(false);
        this.toast.success('Presupuesto creado');
      },
      error: err => { this.toast.error(this.extractError(err, 'Error al crear el presupuesto')); this.submittingBudget.set(false); }
    });
  }

  startEditBudget(b: Budget): void {
    this.editingBudgetId.set(b.id);
    this.confirmDeleteBudgetId.set(null);
    this.editBudget = {
      amount: parseFloat(String(b.amount)),
      period: b.period,
      indefinido: !b.endDate,
      months: 1
    };
  }
  cancelEditBudget(): void { this.editingBudgetId.set(null); }

  saveEditBudget(id: string): void {
    if (this.editBudget.amount <= 0) { this.toast.warning('El monto debe ser mayor a 0'); return; }
    let endDate: string | null = null;
    if (!this.editBudget.indefinido) {
      const now = new Date();
      const end = new Date(now.getFullYear(), now.getMonth() + Math.max(1, this.editBudget.months), 0);
      endDate = end.toISOString().split('T')[0];
    }
    this.financeService.updateBudget(id, {
      amount: this.editBudget.amount,
      period: this.editBudget.period as 'MONTHLY' | 'WEEKLY',
      endDate  // null → indefinido, string → fecha fin
    }).subscribe({
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
    this.toast.warning('Presupuesto general eliminado');
  }

  // ── CATEGORIAS ────────────────────────────────────────────────────────────
  submitCategory(): void {
    if (!this.newCategory.name.trim()) { this.toast.warning('Ingresa un nombre'); return; }
    this.financeService.createCategory({ name: this.newCategory.name.trim(), type: this.newCategory.type }).subscribe({
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
      error: err => this.toast.error(this.extractError(err, 'Error al actualizar'))
    });
  }

  confirmDeleteCategory(id: string): void { this.confirmDeleteCategoryId.set(id); this.editingCategoryId.set(null); }
  cancelDeleteCategory(): void { this.confirmDeleteCategoryId.set(null); }

  deleteCategory(id: string): void {
    this.financeService.deleteCategory(id).subscribe({
      next: () => { this.categories.update(l => l.filter(c => c.id !== id)); this.confirmDeleteCategoryId.set(null); this.toast.success('Categoria eliminada'); },
      error: err => this.toast.error(this.extractError(err, 'Error al eliminar la categoria'))
    });
  }

  // ── METAS ─────────────────────────────────────────────────────────────────
  submitGoal(): void {
    if (!this.newGoal.name.trim()) { this.toast.warning('Ingresa un nombre'); return; }
    if (Number(this.newGoal.targetAmount) <= 0) { this.toast.warning('El monto debe ser mayor a 0'); return; }
    this.submittingGoal.set(true);
    this.financeService.createGoal({ name: this.newGoal.name.trim(), targetAmount: Number(this.newGoal.targetAmount), deadline: this.newGoal.deadline || undefined }).subscribe({
      next: g => { this.goals.update(l => [g, ...l]); this.showGoalForm.set(false); this.newGoal = { name: '', targetAmount: 0, deadline: '' }; this.submittingGoal.set(false); this.toast.success('Meta creada'); },
      error: err => { this.toast.error(this.extractError(err, 'Error al crear la meta')); this.submittingGoal.set(false); }
    });
  }

  startAddProgress(g: Goal): void {
    this.addingProgressGoalId.set(g.id);
    this.editingGoalId.set(null);
    this.progressAmount = 0;
    this.progressAccountId = this.accounts().find(a => parseFloat(String(a.balance)) > 0)?.id ?? '';
  }
  cancelAddProgress(): void { this.addingProgressGoalId.set(null); }

  saveProgress(g: Goal): void {
    if (this.progressAmount <= 0) { this.toast.warning('Ingresa un monto mayor a 0'); return; }
    if (!this.progressAccountId) { this.toast.warning('Selecciona una cuenta'); return; }
    const acc = this.accounts().find(a => a.id === this.progressAccountId);
    if (!acc) return;
    if (this.progressAmount > parseFloat(String(acc.balance))) {
      this.toast.error(`Saldo insuficiente en ${acc.name}`);
      return;
    }
    const newCurrent = Number(g.currentAmount) + Number(this.progressAmount);
    this.financeService.updateGoal(g.id, { currentAmount: newCurrent, fromAccountId: this.progressAccountId }).subscribe({
      next: updated => {
        this.goals.update(l => l.map(x => x.id === g.id ? { ...x, ...updated } : x));
        const deducted = Number(this.progressAmount);
        this.accounts.update(accs => accs.map(a => a.id === this.progressAccountId
          ? { ...a, balance: String(parseFloat(String(a.balance)) - deducted) } : a));
        this.financeService.getSummary().subscribe({ next: d => this.summary.set(d) });
        this.addingProgressGoalId.set(null);
        this.toast.success(newCurrent >= Number(g.targetAmount) ? 'Meta completada' : 'Ahorro registrado');
      },
      error: err => this.toast.error(this.extractError(err, 'Error al guardar el progreso'))
    });
  }

  startEditGoal(g: Goal): void {
    this.editingGoalId.set(g.id);
    this.addingProgressGoalId.set(null);
    this.confirmDeleteGoalId.set(null);
    this.editGoal = { name: g.name, targetAmount: parseFloat(String(g.targetAmount)), deadline: g.deadline ? new Date(g.deadline).toISOString().split('T')[0] : '' };
  }
  cancelEditGoal(): void { this.editingGoalId.set(null); }

  saveEditGoal(id: string): void {
    if (!this.editGoal.name.trim()) { this.toast.warning('Ingresa un nombre'); return; }
    this.financeService.updateGoal(id, { name: this.editGoal.name.trim(), targetAmount: Number(this.editGoal.targetAmount), deadline: this.editGoal.deadline || undefined }).subscribe({
      next: updated => { this.goals.update(l => l.map(g => g.id === id ? { ...g, ...updated } : g)); this.editingGoalId.set(null); this.toast.success('Meta actualizada'); },
      error: err => this.toast.error(this.extractError(err, 'Error al actualizar la meta'))
    });
  }

  confirmDeleteGoal(id: string): void { this.confirmDeleteGoalId.set(id); this.editingGoalId.set(null); }
  cancelDeleteGoal(): void { this.confirmDeleteGoalId.set(null); }

  deleteGoal(id: string): void {
    this.financeService.deleteGoal(id).subscribe({
      next: () => { this.goals.update(l => l.filter(g => g.id !== id)); this.confirmDeleteGoalId.set(null); this.toast.success('Meta eliminada'); },
      error: () => this.toast.error('Error al eliminar la meta')
    });
  }

  // ── RECURRENTES ───────────────────────────────────────────────────────────
  private loadRecurring(): RecurringRule[] {
    try { return JSON.parse(localStorage.getItem(this.RECURRING_KEY) ?? '[]'); }
    catch { return []; }
  }

  private saveRecurring(rules: RecurringRule[]): void {
    localStorage.setItem(this.RECURRING_KEY, JSON.stringify(rules));
  }

  private calcNextDate(from: string, recurrence: string): string {
    const d = new Date(from + 'T12:00:00');
    switch (recurrence) {
      case 'WEEKLY': d.setDate(d.getDate() + 7); break;
      case 'BIWEEKLY': d.setDate(d.getDate() + 14); break;
      case 'MONTHLY': d.setMonth(d.getMonth() + 1); break;
      case 'YEARLY': d.setFullYear(d.getFullYear() + 1); break;
    }
    return d.toISOString().split('T')[0];
  }

  applyRecurring(rule: RecurringRule): void {
    const today = new Date().toISOString().split('T')[0];
    const payload: CreateTransactionPayload = {
      accountId: rule.accountId, categoryId: rule.categoryId,
      amount: rule.amount, type: rule.type,
      description: rule.description, date: today
    };
    this.financeService.createTransaction(payload).subscribe({
      next: res => {
        this.transactions.update(l => [res.transaction, ...l]);
        if (res.alert) this.lastAlert.set(res.alert);
        const nextDate = this.calcNextDate(today, rule.recurrence);
        this.recurringRules.update(rules => rules.map(r => r.id === rule.id ? { ...r, nextDate } : r));
        this.saveRecurring(this.recurringRules());
        this.refreshSummary();
        this.toast.success(`Registrado. Proxima: ${nextDate}`);
      },
      error: err => this.toast.error(this.extractError(err, 'Error al aplicar recurrente'))
    });
  }

  removeRecurring(id: string): void {
    this.recurringRules.update(rules => rules.filter(r => r.id !== id));
    this.saveRecurring(this.recurringRules());
    this.toast.warning('Regla eliminada');
  }

  getRecurrenceLabel(r: string): string {
    return this.recurrenceOptions.find(o => o.value === r)?.label ?? r;
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

  getAccountName(accountId: string): string {
    return this.accounts().find(a => a.id === accountId)?.name ?? '';
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
      .filter(t => t.type === 'EXPENSE' && t.categoryId === categoryId
        && new Date(t.date).getMonth() === now.getMonth()
        && new Date(t.date).getFullYear() === now.getFullYear())
      .reduce((s, t) => s + parseFloat(String(t.amount)), 0);
  }

  getBudgetPct(b: Budget): number {
    const spent = this.computeSpent(b.categoryId), amount = parseFloat(String(b.amount));
    return amount ? Math.min(100, Math.round((spent / amount) * 100)) : 0;
  }

  getGoalProgress(g: Goal): number {
    const current = parseFloat(String(g.currentAmount)), target = parseFloat(String(g.targetAmount));
    return target ? Math.min(100, Math.round((current / target) * 100)) : 0;
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