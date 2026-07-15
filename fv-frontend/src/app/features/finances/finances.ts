import { Component, OnInit, signal, computed, effect, untracked, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { tabSlideAnimation } from '../../core/animations/animations';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../core/services/finance.service';
import { ToastService } from '../../core/services/toast.service';
import { QuickTransactionService, QuickTransferResult } from '../../core/services/quick-transaction.service';
import { PdfExportService } from '../../shared/services/pdf-export.service';
import { AuthService } from '../../core/services/auth.service';
import { GamificationService } from '../../core/services/gamification.service';
import {
  Account, Transaction, Category, Budget, Goal,
  BudgetHealth, FinanceSummary, TransactionAlert, AccountType,
  CreateTransactionPayload, CreateCategoryPayload, CreateBudgetPayload, TransferDisplay
} from '../../core/models/finance.model';
import { EditTransactionModalService } from '../../core/services/edit-transaction-modal.service';
import { filterAmountKey, sanitizeNumberInput, parseAmount, validateAmount, formatCurrency } from '../../shared/utils/amount.utils';
import { buildTransferDisplay } from './transfer-group.util';
import {
  formatDateLabel, isInitBalanceTx, isBalanceAdjustmentTx, getCategoryName, getAccountName,
  getTransactionBg, getTransactionColor, getTransactionSign, getTransactionLabel,
  getAccountTypeLabel, getAccountTypeColor, getGoalProgress,
  computeSpent, getBudgetPct, extractError,
} from './finances.utils';

type Tab = 'resumen' | 'transacciónes' | 'presupuestos' | 'metas';
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
  nextDate: string;
}

@Component({
  selector: 'app-finances',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './finances.html',
  styleUrl: './finances.css',
  animations: [tabSlideAnimation]
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

  newAccount = { name: '', type: 'CASH' as AccountType, initialBalance: 0, countAsIncome: false };

  newTransaction = {
    accountId: '', categoryId: '', amount: 0,
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE' | 'TRANSFER',
    description: '', date: new Date().toISOString().split('T')[0],
    recurrence: 'NONE' as Recurrence
  };

  newBudget = { categoryId: '', amount: 0, period: 'MONTHLY' as 'MONTHLY', months: 1, indefinido: false };
  newGoal = { name: '', targetAmount: 0, deadline: '' };

  editingTxId = signal<string | null>(null);
  editTxType = signal<'INCOME' | 'EXPENSE' | 'TRANSFER'>('EXPENSE');
  editTx = { categoryId: '', amount: 0, description: '', date: '', accountId: '' };
  editTxTransferToAccountId = '';
  editTxTransferGroupId = '';

  showEditDebtConfirm = signal(false);
  pendingEditId = signal<string | null>(null);


  editingBudgetId = signal<string | null>(null);
  editBudget = { amount: 0, period: 'MONTHLY' as 'MONTHLY', categoryId: '', startDate: '', indefinido: false, months: 1 };
  get editBudgetAmount(): number { return this.editBudget.amount; }
  set editBudgetAmount(v: number) { this.editBudget.amount = v; }

  editingGoalId = signal<string | null>(null);
  editGoal = { name: '', targetAmount: 0, deadline: '' };
  addingProgressGoalId = signal<string | null>(null);
  progressAmount = 0;
  progressAccountId = '';

  showCategorySection = signal(false);
  showCategoryForm = signal(false);
  editingCategoryId = signal<string | null>(null);
  newCategory = { name: '', type: 'EXPENSE' as 'INCOME' | 'EXPENSE' };
  editCategory = { name: '' };

  confirmDeleteTxId = signal<string | null>(null);
  confirmDeleteTransferGroupId = signal<string | null>(null);
  confirmDeleteBudgetId = signal<string | null>(null);
  confirmDeleteGoalId = signal<string | null>(null);
  confirmDeleteCategoryId = signal<string | null>(null);

  submittingAccount = signal(false);
  submittingCategory = signal(false);
  editingAccountId = signal<string | null>(null);
  editAccountForm = { name: '', newBalance: 0 };
  showAccountBalanceModal = signal(false);
  private pendingAccountEdit: { acc: Account; mode: 'income' | 'adjustment' } | null = null;

  submittingTx = signal(false);
  submittingBudget = signal(false);
  submittingGoal = signal(false);

  showDebtConfirm = signal(false);
  private pendingDebtPayload: CreateTransactionPayload | null = null;

  txFilter = signal<TxTypeFilter>('ALL');
  txDateMode = signal<TxDateMode>('MONTH');
  txMonth = signal(new Date().getMonth());
  txYear = signal(new Date().getFullYear());
  txViewMode = signal<ViewMode>('list');

  calMonth = signal(new Date().getMonth());
  calYear = signal(new Date().getFullYear());
  calTypeFilter = signal<TxTypeFilter>('ALL');
  calendarDayKey = signal<string | null>(null);

  globalBudgetLimit = signal<number>(parseFloat(localStorage.getItem('fv_global_budget') ?? '0'));
  showGlobalForm = signal(false);
  newGlobalLimit = 0;

  showExportModal = signal(false);
  exportDateFrom = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  exportDateTo = signal(new Date().toISOString().split('T')[0]);
  exporting = signal(false);

  confirmNavAction = signal<{ title: string; message: string; onConfirm: () => void } | null>(null);

  showCategoryDeleteWarning = signal(false);
  categoryDeleteInfo = signal<{ id: string; name: string; txCount: number; budgetCount: number } | null>(null);
  categoryReassignId = signal('');

  private readonly RECURRING_KEY = 'fv_recurring';
  recurringRules = signal<RecurringRule[]>(this.loadRecurring());

  readonly monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  readonly weekDays = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  readonly tabs: { key: Tab; label: string }[] = [
    { key: 'resumen', label: 'Resumen' },
    { key: 'transacciónes', label: 'Transacciones' },
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

  expenseCategories = computed(() => this.categories().filter(c => c.type === 'EXPENSE'));
  userCategories = computed(() => this.categories().filter(c => !c.isGlobal));
  globalCategories = computed(() => this.categories().filter(c => c.isGlobal));

  filteredCategories = computed(() => {
    const t = this.newTransaction.type;
    if (t === 'INCOME') return this.categories().filter(c => c.type === 'INCOME');
    if (t === 'EXPENSE') return this.categories().filter(c => c.type === 'EXPENSE');
    return this.categories();
  });

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

  visibleTransactions = computed<(Transaction | TransferDisplay)[]>(() => {
    return buildTransferDisplay(this.filteredTransactions(), this.accounts());
  });

  recentTransactions = computed<(Transaction | TransferDisplay)[]>(() => {
    return buildTransferDisplay(this.transactions(), this.accounts()).slice(0, 5);
  });

  groupedTransactions = computed(() => {
    const map = new Map<string, (Transaction | TransferDisplay)[]>();
    for (const tx of this.visibleTransactions()) {
      const key = tx.date.substring(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tx);
    }
    return Array.from(map.entries())
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([date, items]) => ({
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
        income: vis.filter(t => t.type === 'INCOME' && !t.isInitialBalance).reduce((s, t) => s + parseFloat(String(t.amount)), 0),
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
    return this.transactions()
      .filter(t => {
        if (t.date.substring(0, 10) !== key) return false;
        return typeF === 'ALL' || t.type === typeF;
      })
      .sort((a, b) => {
        const aMs = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
        const bMs = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
        return bMs - aMs;
      });
  });

  generalBudgets = computed(() => this.budgets().filter(b => !b.categoryId));
  categoryBudgets = computed(() => this.budgets().filter(b => !!b.categoryId));

  globalBudgetPct = computed(() => {
    const limit = this.globalBudgetLimit(), h = this.health();
    if (!limit || !h) return 0;
    return Math.min(100, Math.round((h.expenses / limit) * 100));
  });

  pendingRecurring = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.recurringRules().filter(r => r.nextDate <= today);
  });

  private editTxService = inject(EditTransactionModalService);
  private destroyRef    = inject(DestroyRef);

  constructor(
    private financeService: FinanceService,
    private toast: ToastService,
    private quickTxService: QuickTransactionService,
    private pdfExport: PdfExportService,
    public authService: AuthService,
    private gamificationService: GamificationService
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
      const res = this.quickTxService.lastTransferCreated();
      if (!res) return;
      // Check if either transaction already exists
      if (this.transactions().some(t => t.id === res.fromTransaction.id)) return;
      // Add both transactions from the transfer
      this.transactions.update(l => [res.fromTransaction, res.toTransaction, ...l]);
      this.refreshSummary();
    });

    effect(() => {
      const tick = this.quickTxService.reloadTick();
      if (tick === 0) return;
      this.reloadAll();
    });
  }

  ngOnInit(): void {
    this.editTxService.saved$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.editingTxId.set(null);
        this.reloadAll();
      });

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

  setTab(t: Tab) { this.tryNavigate(() => { this.activeTab.set(t); this.resetAllFormState(); }); }
  dismissAlert() { this.lastAlert.set(null); }
  openQuickModal(type: 'INCOME' | 'EXPENSE' | 'TRANSFER' = 'EXPENSE') { this.quickTxService.open(type); }

  hasEditingOpen(): boolean {
    return !!(this.editTxService.show() || this.editingAccountId() || this.editingTxId() ||
      this.editingCategoryId() || this.editingBudgetId() ||
      this.editingGoalId() || this.addingProgressGoalId() ||
      this.confirmDeleteTxId() || this.confirmDeleteCategoryId() ||
      this.confirmDeleteBudgetId() || this.confirmDeleteGoalId() ||
      this.showEditDebtConfirm() || this.showDebtConfirm() ||
      this.showAccountForm() || this.showTransactionForm() ||
      this.showBudgetForm() || this.showGoalForm() ||
      this.showCategoryForm() || this.showGlobalForm());
  }

  tryNavigate(action: () => void): void {
    if (this.hasEditingOpen()) {
      this.confirmNavAction.set({
        title: 'Cambios sin guardar',
        message: 'Hay formularios abiertos. ¿Deseas descartarlos?',
        onConfirm: () => { this.resetAllFormState(); this.confirmNavAction.set(null); action(); }
      });
    } else {
      action();
    }
  }

  resetAllFormState(): void {
    this.showAccountForm.set(false);
    this.showTransactionForm.set(false);
    this.showBudgetForm.set(false);
    this.showGoalForm.set(false);
    this.showCategoryForm.set(false);
    this.showGlobalForm.set(false);
    this.editingTxId.set(null);
    this.editingCategoryId.set(null);
    this.editingBudgetId.set(null);
    this.editingGoalId.set(null);
    this.addingProgressGoalId.set(null);
    this.confirmDeleteTxId.set(null);
    this.confirmDeleteCategoryId.set(null);
    this.confirmDeleteBudgetId.set(null);
    this.confirmDeleteGoalId.set(null);
    this.showEditDebtConfirm.set(false);
    this.pendingEditId.set(null);
    this.showDebtConfirm.set(false);
    this.pendingDebtPayload = null;
    this.pendingEditId.set(null);
    this.editingAccountId.set(null);
    this.showAccountBalanceModal.set(false);
    this.pendingAccountEdit = null;
    this.calendarDayKey.set(null);
  }

  submitAccount(): void {
    if (!this.newAccount.name.trim()) { this.toast.warning('Ingresa un nombre'); return; }
    const initBalance = Number(this.newAccount.initialBalance);
    this.submittingAccount.set(true);
    this.financeService.createAccount({
      name: this.newAccount.name.trim(), type: this.newAccount.type,
      initialBalance: 0,
      countAsIncome: false
    }).subscribe({
      next: acc => {
        this.accounts.update(l => [acc, ...l]);
        this.showAccountForm.set(false);
        if (initBalance > 0) {
          this.editAccountForm.newBalance = initBalance;
          this.pendingAccountEdit = { acc, mode: 'adjustment' };
          this.showAccountBalanceModal.set(true);
        } else {
          this.newAccount = { name: '', type: 'CASH', initialBalance: 0, countAsIncome: false };
          this.toast.success('Cuenta creada');
        }
        this.submittingAccount.set(false);
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

  startEditAccount(acc: Account): void {
    this.editingAccountId.set(acc.id);
    this.editAccountForm = {
      name: acc.name,
      newBalance: parseFloat(String(acc.balance))
    };
  }

  cancelEditAccount(): void {
    this.editingAccountId.set(null);
  }

  cancelAccountEdit(): void {
    this.showAccountBalanceModal.set(false);
    this.pendingAccountEdit = null;
    this.cancelEditAccount();
  }

  saveEditAccount(acc: Account): void {
    if (!this.editAccountForm.name.trim()) { this.toast.warning('Ingresa un nombre'); return; }
    const newBalance = this.sanitizeNumber(this.editAccountForm.newBalance);
    const originalBalance = parseFloat(String(acc.balance));
    const balanceChanged = Math.abs(newBalance - originalBalance) > 0.001;
    const nameChanged = this.editAccountForm.name.trim() !== acc.name;

    if (!balanceChanged) {
      if (!nameChanged) { this.cancelEditAccount(); return; }
      this.financeService.updateAccount(acc.id, { name: this.editAccountForm.name.trim() }).subscribe({
        next: updated => {
          this.accounts.update(l => l.map(a => a.id === acc.id ? { ...a, ...updated } : a));
          this.cancelEditAccount();
          this.toast.success('Cuenta actualizada');
        },
        error: err => this.toast.error(this.extractError(err, 'Error al actualizar la cuenta'))
      });
      return;
    }

    this.pendingAccountEdit = { acc, mode: 'adjustment' };
    this.showAccountBalanceModal.set(true);
  }

  confirmAccountEdit(mode: 'income' | 'adjustment'): void {
    const pending = this.pendingAccountEdit;
    if (!pending) return;
    this.showAccountBalanceModal.set(false);

    const acc = pending.acc;
    const newBalance = this.sanitizeNumber(this.editAccountForm.newBalance);
    const originalBalance = parseFloat(String(acc.balance));
    const diff = newBalance - originalBalance;
    const nameChanged = this.editAccountForm.name.trim() !== acc.name;

    // Optimistic account balance update
    if (diff !== 0) {
      this.accounts.update(accs => accs.map(a => a.id === acc.id ? { ...a, balance: String(newBalance) } : a));
    }

    const updateName$ = nameChanged
      ? this.financeService.updateAccount(acc.id, { name: this.editAccountForm.name.trim() })
      : null;

    const afterNameUpdate = () => {
      if (mode === 'adjustment') {
        if (diff === 0) { this.cancelEditAccount(); this.pendingAccountEdit = null; return; }
        const cat = diff > 0
          ? this.categories().find(c => c.type === 'INCOME')
          : this.categories().find(c => c.type === 'EXPENSE');
        if (!cat) { this.toast.error(`No hay categoría de ${diff > 0 ? 'ingreso' : 'gasto'} disponible`); return; }
        this.financeService.createTransaction({
          accountId: acc.id,
          categoryId: cat.id,
          amount: Math.abs(diff),
          type: diff > 0 ? 'INCOME' : 'EXPENSE',
          description: `Ajuste directo de ${acc.name}`,
          date: new Date().toISOString().split('T')[0],
          isInitialBalance: true,
        }).subscribe({
          next: res => {
            this.transactions.update(l => [res.transaction, ...l]);
            this.pendingAccountEdit = null;
            this.cancelEditAccount();
            this.toast.success('Ajuste directo registrado');
          },
          error: err => {
            // Rollback on error
            if (diff !== 0) this.accounts.update(accs => accs.map(a => a.id === acc.id ? { ...a, balance: String(originalBalance) } : a));
            this.toast.error(this.extractError(err, 'Error al registrar el ajuste directo'))
          }
        });
      } else {
        if (diff === 0) { this.cancelEditAccount(); this.pendingAccountEdit = null; return; }
        const incomeCategories = this.categories().filter(c => c.type === 'INCOME');
        const cat = incomeCategories[0];
        if (!cat) { this.toast.error('No hay categoría de ingreso disponible'); return; }

        const txPayload: CreateTransactionPayload = {
          accountId: acc.id,
          categoryId: cat.id,
          amount: Math.abs(diff),
          type: diff > 0 ? 'INCOME' : 'EXPENSE',
          description: `Ajuste de balance de ${acc.name}`,
          date: new Date().toISOString().split('T')[0],
          allowNegative: diff < 0
        };
        this.financeService.createTransaction(txPayload).subscribe({
          next: res => {
            this.transactions.update(l => [res.transaction, ...l]);
            this.pendingAccountEdit = null;
            this.cancelEditAccount();
            this.toast.success('Ajuste registrado como transacción');
          },
          error: err => {
            // Rollback on error
            if (diff !== 0) this.accounts.update(accs => accs.map(a => a.id === acc.id ? { ...a, balance: String(originalBalance) } : a));
            this.toast.error(this.extractError(err, 'Error al registrar el ajuste'))
          }
        });
      }
    };

    if (updateName$) {
      updateName$.subscribe({
        next: updated => {
          this.accounts.update(l => l.map(a => a.id === acc.id ? { ...a, ...updated } : a));
          afterNameUpdate();
        },
        error: err => this.toast.error(this.extractError(err, 'Error al actualizar la cuenta'))
      });
    } else {
      afterNameUpdate();
    }
  }

  submitTransaction(): void {
    if (!this.newTransaction.accountId) { this.toast.warning('Selecciona una cuenta'); return; }
    if (!this.newTransaction.categoryId) { this.toast.warning('Selecciona una categoría'); return; }
    const err = this.validateAmount(this.newTransaction.amount);
    if (err) { this.toast.warning(err); return; }
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
    // Optimistic account balance update
    this.updateAccountBalancesForTransaction(payload, Number(payload.amount));
    
    this.financeService.createTransaction(payload).subscribe({
      next: res => {
        this.transactions.update(l => [res.transaction, ...l]);
        if (res.alert) this.lastAlert.set(res.alert);
        this.gamificationService.registerStreak().subscribe();
        this.gamificationService.loadStats().subscribe();

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
          this.toast.success('Transacción registrada y regla recurrente guardada');
        } else {
          this.toast.success('Transacción registrada');
        }

        this.showTransactionForm.set(false);
        this.newTransaction = {
          accountId: '', categoryId: '', amount: 0, type: 'EXPENSE',
          description: '', date: new Date().toISOString().split('T')[0], recurrence: 'NONE'
        };
        this.submittingTx.set(false);
      },
      error: err => {
        // Rollback optimistic update on error
        this.updateAccountBalancesForTransaction(payload, -Number(payload.amount));
        this.toast.error(this.extractError(err, 'Error al registrar'));
        this.submittingTx.set(false);
      }
    });
  }

  startEditTx(tx: Transaction | TransferDisplay): void {
    this.confirmDeleteTxId.set(null);
    this.confirmDeleteTransferGroupId.set(null);
    this.editTxService.open(tx);
  }
  cancelEditTx(): void { this.editingTxId.set(null); }

  onEditTxTypeChange(t: 'INCOME' | 'EXPENSE' | 'TRANSFER'): void {
    this.editTxType.set(t);
    this.editTx.categoryId = '';
  }

  saveEditTx(id: string): void {
    const err = this.validateAmount(this.editTx.amount);
    if (err) { this.toast.warning(err); return; }

    if (this.editTxType() === 'TRANSFER') {
      if (!this.editTx.accountId) { this.toast.warning('Selecciona cuenta origen'); return; }
      if (!this.editTxTransferToAccountId) { this.toast.warning('Selecciona cuenta destino'); return; }
      if (this.editTx.accountId === this.editTxTransferToAccountId) { this.toast.warning('Las cuentas deben ser diferentes'); return; }

      // Find old transfer to calculate deltas
      const oldTransfer = this.transactions().find(t => t.transferGroupId === this.editTxTransferGroupId);
      const isTransferDisplay = oldTransfer && 'fromAccountId' in oldTransfer;
      const oldFromAccountId = isTransferDisplay ? (oldTransfer as any).fromAccountId : oldTransfer?.accountId;
      const oldToAccountId = isTransferDisplay ? (oldTransfer as any).toAccountId : undefined;
      const oldAmount = oldTransfer ? parseFloat(String(oldTransfer.amount)) : 0;

      const newFromAccountId = this.editTx.accountId;
      const newToAccountId = this.editTxTransferToAccountId;
      const newAmount = Number(this.editTx.amount);

      // Optimistic updates
      if (oldFromAccountId) {
        this.accounts.update(accs => accs.map(a => a.id === oldFromAccountId
          ? { ...a, balance: String(parseFloat(String(a.balance)) + oldAmount) } : a));
      }
      if (oldToAccountId && oldToAccountId !== oldFromAccountId) {
        this.accounts.update(accs => accs.map(a => a.id === oldToAccountId
          ? { ...a, balance: String(parseFloat(String(a.balance)) - oldAmount) } : a));
      }
      if (newFromAccountId) {
        this.accounts.update(accs => accs.map(a => a.id === newFromAccountId
          ? { ...a, balance: String(parseFloat(String(a.balance)) - newAmount) } : a));
      }
      if (newToAccountId && newToAccountId !== newFromAccountId) {
        this.accounts.update(accs => accs.map(a => a.id === newToAccountId
          ? { ...a, balance: String(parseFloat(String(a.balance)) + newAmount) } : a));
      }

      this.financeService.updateTransfer(this.editTxTransferGroupId, {
        fromAccountId: newFromAccountId,
        toAccountId: newToAccountId,
        amount: newAmount,
        description: this.editTx.description.trim() || undefined,
        date: this.editTx.date || undefined,
      }).subscribe({
        next: () => {
          this.toast.success('Transferencia actualizada');
          this.editingTxId.set(null);
          this.editTxTransferGroupId = '';
          this.editTxTransferToAccountId = '';
        },
        error: err => {
          // Rollback optimistic updates
          if (newFromAccountId) this.accounts.update(accs => accs.map(a => a.id === newFromAccountId
            ? { ...a, balance: String(parseFloat(String(a.balance)) + newAmount) } : a));
          if (newToAccountId && newToAccountId !== newFromAccountId) this.accounts.update(accs => accs.map(a => a.id === newToAccountId
            ? { ...a, balance: String(parseFloat(String(a.balance)) - newAmount) } : a));
          if (oldFromAccountId) this.accounts.update(accs => accs.map(a => a.id === oldFromAccountId
            ? { ...a, balance: String(parseFloat(String(a.balance)) - oldAmount) } : a));
          if (oldToAccountId && oldToAccountId !== oldFromAccountId) this.accounts.update(accs => accs.map(a => a.id === oldToAccountId
            ? { ...a, balance: String(parseFloat(String(a.balance)) + oldAmount) } : a));
          this.toast.error(this.extractError(err, 'Error al actualizar transferencia'))
        }
      });
      return;
    }

    if (!this.editTx.accountId) { this.toast.warning('Selecciona una cuenta'); return; }

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
    const oldTx = this.transactions().find(t => t.id === id);
    const oldAccountId = oldTx?.accountId;
    const oldAmount = oldTx ? parseFloat(String(oldTx.amount)) : 0;
    const oldType = oldTx?.type;

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

        // Optimistic account balance update
        if (oldAccountId && oldAccountId === this.editTx.accountId) {
          const newAmount = Number(this.editTx.amount);
          const newType = this.editTxType();
          let delta = 0;
          if (oldType === 'INCOME') delta -= oldAmount;
          else if (oldType === 'EXPENSE') delta += oldAmount;
          if (newType === 'INCOME') delta += newAmount;
          else if (newType === 'EXPENSE') delta -= newAmount;
          if (delta !== 0) {
            this.accounts.update(accs => accs.map(a => a.id === oldAccountId
              ? { ...a, balance: String(parseFloat(String(a.balance)) + delta) } : a));
          }
        } else if (oldAccountId && oldAccountId !== this.editTx.accountId) {
          // Account changed: reverse old, apply new
          const oldAcc = this.accounts().find(a => a.id === oldAccountId);
          const newAcc = this.accounts().find(a => a.id === this.editTx.accountId);
          if (oldAcc) {
            let delta = 0;
            if (oldType === 'INCOME') delta -= oldAmount;
            else if (oldType === 'EXPENSE') delta += oldAmount;
            this.accounts.update(accs => accs.map(a => a.id === oldAccountId
              ? { ...a, balance: String(parseFloat(String(a.balance)) + delta) } : a));
          }
          if (newAcc) {
            const newAmount = Number(this.editTx.amount);
            const newType = this.editTxType();
            let delta = 0;
            if (newType === 'INCOME') delta += newAmount;
            else if (newType === 'EXPENSE') delta -= newAmount;
            this.accounts.update(accs => accs.map(a => a.id === this.editTx.accountId
              ? { ...a, balance: String(parseFloat(String(a.balance)) + delta) } : a));
          }
        }

        this.toast.success('Transacción actualizada');
      },
      error: err => this.toast.error(this.extractError(err, 'Error al actualizar'))
    });
  }

  confirmDeleteTx(id: string): void { this.confirmDeleteTxId.set(id); this.confirmDeleteTransferGroupId.set(null); this.editingTxId.set(null); }
  cancelDeleteTx(): void { this.confirmDeleteTxId.set(null); this.confirmDeleteTransferGroupId.set(null); }
  confirmDeleteTransfer(groupId: string): void { this.confirmDeleteTransferGroupId.set(groupId); this.confirmDeleteTxId.set(null); this.editingTxId.set(null); }
  cancelDeleteTransfer(): void { this.confirmDeleteTransferGroupId.set(null); }

  deleteTransaction(idOrGroup: string, isTransferGroup = false): void {
    if (isTransferGroup) {
      // Get the transfer legs to calculate balance changes
      const transferLegs = this.transactions().filter(t => t.transferGroupId === idOrGroup);
      const fromLeg = transferLegs.find(t => t.type === 'TRANSFER' && t.accountId); // from account (negative)
      const toLeg = transferLegs.find(t => t.type === 'TRANSFER' && t.accountId !== fromLeg?.accountId); // to account (positive)
      const fromAccountId = fromLeg?.accountId;
      const toAccountId = toLeg?.accountId;
      const amount = fromLeg ? parseFloat(String(fromLeg.amount)) : 0;

      this.financeService.deleteTransfer(idOrGroup).subscribe({
        next: () => {
          this.transactions.update(l => l.filter(t => t.transferGroupId !== idOrGroup));
          this.confirmDeleteTxId.set(null);

          // Optimistic account balance update for transfer delete
          if (fromAccountId && amount > 0) {
            // Reverse: from account gets money back, to account loses money
            this.accounts.update(accs => accs.map(a => {
              if (a.id === fromAccountId) return { ...a, balance: String(parseFloat(String(a.balance)) + amount) };
              if (a.id === toAccountId) return { ...a, balance: String(parseFloat(String(a.balance)) - amount) };
              return a;
            }));
          }

          this.toast.success('Transferencia eliminada');
        },
        error: () => this.toast.error('Error al eliminar la transferencia')
      });
      return;
    }
    const txToDelete = this.transactions().find(t => t.id === idOrGroup);
    const txAccountId = txToDelete?.accountId;
    const txAmount = txToDelete ? parseFloat(String(txToDelete.amount)) : 0;
    const txType = txToDelete?.type;

    this.financeService.deleteTransaction(idOrGroup).subscribe({
      next: () => {
        this.transactions.update(l => l.filter(t => t.id !== idOrGroup));
        this.confirmDeleteTxId.set(null);
        this.calendarDayKey.set(null);

        // Optimistic account balance update
        if (txAccountId && txType) {
          let delta = 0;
          if (txType === 'INCOME') delta -= txAmount;
          else if (txType === 'EXPENSE') delta += txAmount;
          if (delta !== 0) {
            this.accounts.update(accs => accs.map(a => a.id === txAccountId
              ? { ...a, balance: String(parseFloat(String(a.balance)) + delta) } : a));
          }
        }

        this.toast.success('Transacción eliminada');
      },
      error: () => this.toast.error('Error al eliminar la transacción')
    });
  }

  setViewMode(mode: ViewMode): void {
    this.tryNavigate(() => {
      this.txViewMode.set(mode);
      if (mode === 'calendar') {
        this.calMonth.set(this.txDateMode() === 'MONTH' ? this.txMonth() : new Date().getMonth());
        this.calYear.set(this.txDateMode() === 'MONTH' ? this.txYear() : new Date().getFullYear());
      }
    });
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

  submitBudget(): void {
    const err = this.validateAmount(this.newBudget.amount);
    if (err) { this.toast.warning(err); return; }
    const now = new Date();
    let endDate: string | null = null;
    if (!this.newBudget.indefinido) {
      const months = Math.max(1, this.newBudget.months);
      endDate = new Date(now.getFullYear(), now.getMonth() + months, 0).toISOString().split('T')[0];
    }
    const payload: CreateBudgetPayload = {
      amount: Number(this.newBudget.amount),
      period: 'MONTHLY',
      startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
      endDate: endDate ?? undefined,
    };
    if (this.newBudget.categoryId) payload.categoryId = this.newBudget.categoryId;
    this.submittingBudget.set(true);
    this.financeService.createBudget(payload).subscribe({
      next: b => {
        this.budgets.update(l => [b, ...l]);
        this.showBudgetForm.set(false);
        this.newBudget = { categoryId: '', amount: 0, period: 'MONTHLY', months: 1, indefinido: false };
        this.submittingBudget.set(false);
        this.toast.success('Presupuesto creado');
      },
      error: err => { this.toast.error(this.extractError(err, 'Error al crear el presupuesto')); this.submittingBudget.set(false); }
    });
  }

  startEditBudget(b: Budget): void {
    this.editingBudgetId.set(b.id);
    this.confirmDeleteBudgetId.set(null);
    this.editBudgetAmount = parseFloat(String(b.amount));
    this.editBudget = {
      amount: parseFloat(String(b.amount)),
      period: 'MONTHLY',
      categoryId: b.categoryId,
      startDate: b.startDate ? new Date(b.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      indefinido: !b.endDate,
      months: 1
    };
  }
  cancelEditBudget(): void { this.editingBudgetId.set(null); }

  saveEditBudget(id: string): void {
    const err = this.validateAmount(this.editBudgetAmount);
    if (err) { this.toast.warning(err); return; }
    let endDate: string | null = null;
    if (!this.editBudget.indefinido) {
      const end = new Date(this.editBudget.startDate + 'T12:00:00');
      end.setMonth(end.getMonth() + Math.max(1, this.editBudget.months));
      end.setDate(end.getDate() - 1);
      endDate = end.toISOString().split('T')[0];
    }
    const payload: Record<string, any> = {
      startDate: this.editBudget.startDate || null,
      amount: this.editBudgetAmount,
      period: 'MONTHLY',
      endDate,
    };
    if (this.editBudget.categoryId) payload['categoryId'] = this.editBudget.categoryId;
    this.financeService.updateBudget(id, payload).subscribe({
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
    const err = this.validateAmount(this.newGlobalLimit);
    if (err) { this.toast.warning(err); return; }
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

  submitCategory(): void {
    if (!this.newCategory.name.trim()) { this.toast.warning('Ingresa un nombre'); return; }
    if (this.submittingCategory()) return;
    this.submittingCategory.set(true);
    this.financeService.createCategory({ name: this.newCategory.name.trim(), type: this.newCategory.type }).subscribe({
      next: cat => {
        this.categories.update(l => [...l, cat].sort((a, b) => a.name.localeCompare(b.name)));
        this.showCategoryForm.set(false);
        this.newCategory = { name: '', type: 'EXPENSE' };
        this.submittingCategory.set(false);
        this.toast.success('Categoría creada');
      },
      error: err => { this.toast.error(this.extractError(err, 'Error al crear la categoría')); this.submittingCategory.set(false); }
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
    if (this.submittingCategory()) return;
    this.submittingCategory.set(true);
    this.financeService.updateCategory(id, { name: this.editCategory.name.trim() }).subscribe({
      next: updated => {
        if (updated.id !== id) {
          this.categories.update(l => [...l.filter(c => c.id !== id), updated]);
          this.toast.success('Categoría personalizada creada. La original permanece para otros usuarios.');
        } else {
          this.categories.update(l => l.map(c => c.id === id ? { ...c, ...updated } : c));
          this.toast.success('Categoría actualizada');
        }
        this.editingCategoryId.set(null);
        this.submittingCategory.set(false);
      },
      error: err => { this.toast.error(this.extractError(err, 'Error al actualizar')); this.submittingCategory.set(false); }
    });
  }

  confirmDeleteCategory(id: string): void {
    const cat = this.categories().find(c => c.id === id);
    if (!cat) return;
    const txCount = this.transactions().filter(t => t.categoryId === id).length;
    const budgetCount = this.budgets().filter(b => b.categoryId === id).length;
    if (txCount > 0 || budgetCount > 0) {
      this.showCategoryDeleteWarning.set(true);
      this.categoryDeleteInfo.set({ id, name: cat.name, txCount, budgetCount });
      this.categoryReassignId.set('');
    } else {
      this.confirmDeleteCategoryId.set(id);
      this.editingCategoryId.set(null);
    }
  }

  cancelDeleteCategory(): void { this.confirmDeleteCategoryId.set(null); }

  private deletingCategory = false;
  deleteCategory(id: string, reassignToId?: string): void {
    if (this.deletingCategory) return;
    this.deletingCategory = true;
    this.financeService.deleteCategory(id, reassignToId).subscribe({
      next: (res: any) => {
        this.categories.update(l => l.filter(c => c.id !== id));
        this.budgets.update(l => l.filter(b => b.categoryId !== id));
        this.confirmDeleteCategoryId.set(null);
        this.showCategoryDeleteWarning.set(false);
        this.categoryDeleteInfo.set(null);
        this.deletingCategory = false;
        const msg = res?.message ?? 'Categoría eliminada';
        this.toast.success(msg);
      },
      error: err => {
        this.toast.error(this.extractError(err, 'Error al eliminar la categoría'));
        this.confirmDeleteCategoryId.set(null);
        this.showCategoryDeleteWarning.set(false);
        this.categoryDeleteInfo.set(null);
        this.deletingCategory = false;
      }
    });
  }

  confirmDeleteCategoryWithReassign(): void {
    const info = this.categoryDeleteInfo();
    if (!info) return;
    if (info.txCount > 0 && !this.categoryReassignId()) {
      this.toast.warning('Selecciona una categoría de reasignación');
      return;
    }
    this.deleteCategory(info.id, this.categoryReassignId() || undefined);
  }

  cancelDeleteCategoryWithReassign(): void {
    this.showCategoryDeleteWarning.set(false);
    this.categoryDeleteInfo.set(null);
    this.confirmDeleteCategoryId.set(null);
  }

  submitGoal(): void {
    if (!this.newGoal.name.trim()) { this.toast.warning('Ingresa un nombre'); return; }
    const err = this.validateAmount(this.newGoal.targetAmount);
    if (err) { this.toast.warning(err); return; }
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
    const err = this.validateAmount(this.progressAmount);
    if (err) { this.toast.warning(err); return; }
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
    const err = this.validateAmount(this.editGoal.targetAmount);
    if (err) { this.toast.warning(err); return; }
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

  isInitBalanceTx(tx: any): boolean { return isInitBalanceTx(tx); }
  isBalanceAdjustmentTx(tx: any): boolean { return isBalanceAdjustmentTx(tx); }

  editBudgetCategoryDeleted(): boolean {
    return !!this.editingBudgetId() && !!this.editBudget.categoryId && !this.categories().some(c => c.id === this.editBudget.categoryId);
  }

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

  formatCurrency = formatCurrency;
  formatDateLabel = formatDateLabel;
  getAccountTypeLabel = getAccountTypeLabel;
  getAccountTypeColor = getAccountTypeColor;
  getGoalProgress = getGoalProgress;

  getAccountName(accountId: string): string {
    return getAccountName(this.accounts(), accountId);
  }

  getCategoryName(categoryId: string): string {
    return getCategoryName(this.categories(), categoryId);
  }

  getTransactionBg(tx: Transaction | TransferDisplay): string {
    return getTransactionBg(tx);
  }

  getTransactionColor(tx: Transaction | TransferDisplay): string {
    return getTransactionColor(tx);
  }

  getTransactionSign(tx: Transaction | TransferDisplay): string {
    return getTransactionSign(tx);
  }

  getTransactionLabel(tx: Transaction | TransferDisplay): string {
    return getTransactionLabel(tx, this.categories());
  }

  computeSpent(categoryId: string): number {
    return computeSpent(this.transactions(), categoryId);
  }

  getBudgetPct(b: Budget): number {
    return getBudgetPct(b, this.transactions());
  }

  extractError(err: any, fallback: string): string {
    return extractError(err, fallback);
  }

  sanitizeNumber(val: any): number { return parseAmount(val); }
  filterAmountKey = filterAmountKey;
  sanitizeStr(val: any): string { return sanitizeNumberInput(val); }
  validateAmount = validateAmount;

  private updateAccountBalanceOptimistic(accountId: string, amountChange: number): void {
    this.accounts.update(accs => accs.map(a => a.id === accountId
      ? { ...a, balance: String(Math.max(0, parseFloat(String(a.balance)) + amountChange)) } : a));
  }

  private updateAccountBalancesForTransaction(payload: CreateTransactionPayload, amount: number): void {
    if (payload.type === 'INCOME') {
      this.updateAccountBalanceOptimistic(payload.accountId, amount);
    } else if (payload.type === 'EXPENSE') {
      this.updateAccountBalanceOptimistic(payload.accountId, -amount);
    }
  }

  refreshSummary(): void {
    this.financeService.getSummary().subscribe({ next: d => this.summary.set(d) });
    this.financeService.getBudgetHealth().subscribe({ next: d => this.health.set(d) });
  }

  private reloading = false;

  reloadAll(): void {
    if (this.reloading) return;
    this.reloading = true;
    this.loading.set(true);
    let loaded = 0;
    const done = () => {
      if (++loaded >= 7) {
        this.loading.set(false);
        this.reloading = false;
      }
    };
    this.financeService.getSummary().subscribe({ next: d => { this.summary.set(d); done(); }, error: done });
    this.financeService.getBudgetHealth().subscribe({ next: d => { this.health.set(d); done(); }, error: done });
    this.financeService.getAccounts().subscribe({ next: d => { this.accounts.set(d); done(); }, error: done });
    this.financeService.getTransactions().subscribe({ next: d => { this.transactions.set(d); done(); }, error: done });
    this.financeService.getCategories().subscribe({ next: d => { this.categories.set(d); done(); }, error: done });
    this.financeService.getBudgets().subscribe({ next: d => { this.budgets.set(d); done(); }, error: done });
    this.financeService.getGoals().subscribe({ next: d => { this.goals.set(d); done(); }, error: done });
  }

  async triggerExport(): Promise<void> {
    if (!this.summary() || !this.health()) {
      this.toast.warning('Espera a que carguen los datos');
      return;
    }
    this.exporting.set(true);
    const from = this.exportDateFrom();
    const to = this.exportDateTo();

    try {
      const blob = await firstValueFrom(this.financeService.exportPdfServerSide(from, to));
      if (!blob || blob.size === 0) throw new Error('PDF vacío recibido del backend');
      this.downloadBlob(blob, `FinanzaViva_${from}_${to}.pdf`);
      this.showExportModal.set(false);
      this.toast.success('PDF generado correctamente');
    } catch (backendError) {
      console.error('export-pdf backend falló, usando fallback local', backendError);
      try {
        const transferGroups: { groupId: string; fromAccountId: string; toAccountId: string; amount: number; description: string | null; date: string }[] = [];
        const transferMap = new Map<string, Transaction[]>();
        for (const tx of this.transactions()) {
          if (tx.type === 'TRANSFER' && tx.transferGroupId) {
            const g = transferMap.get(tx.transferGroupId) || [];
            g.push(tx);
            transferMap.set(tx.transferGroupId, g);
          }
        }
        for (const [, g] of transferMap) {
          if (g.length >= 2) {
            const fromLeg = g.find(t => {
              const other = g.find(o => o.id !== t.id);
              return other && t.accountId !== other.accountId;
            }) ?? g[0];
            const toLeg = g.find(t => t.id !== fromLeg.id)!;
            transferGroups.push({ groupId: fromLeg.transferGroupId!, fromAccountId: fromLeg.accountId, toAccountId: toLeg.accountId, amount: parseFloat(String(fromLeg.amount)), description: fromLeg.description || toLeg.description, date: fromLeg.date });
          }
        }

        await this.pdfExport.generateReport(
          {
            userName: this.authService.currentUser()?.displayName ?? 'Usuario',
            transactions: this.transactions(),
            accounts: this.accounts(),
            budgets: this.budgets(),
            goals: this.goals(),
            categories: this.categories(),
            summary: this.summary()!,
            health: this.health()!,
            transferGroups,
          },
          { from, to }
        );
        this.showExportModal.set(false);
        this.toast.success('PDF generado correctamente');
      } catch (frontendError) {
        this.toast.error('Error al generar el PDF');
        console.error(frontendError);
      }
    } finally {
      this.exporting.set(false);
    }
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  getTransferDestinations(): Account[] {
    return this.accounts().filter(a => a.id !== this.editTx.accountId);
  }
}