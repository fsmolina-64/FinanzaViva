import {
  Component, OnInit, ViewChild, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../../core/services/finance.service';
import { ToastService } from '../../../core/services/toast.service';
import { EditTransactionModalService } from '../../../core/services/edit-transaction-modal.service';
import { Account, Category, Transaction, TransferDisplay, Goal } from '../../../core/models/finance.model';
import { NumpadComponent } from '../../../shared/components/numpad/numpad.component';
import { formatCurrency } from '../../../shared/utils/amount.utils';
import { isSavingsTx } from '../finances.utils';

type EditMode = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'BALANCE';

@Component({
  selector: 'app-edit-transaction-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, NumpadComponent],
  templateUrl: './edit-transaction-modal.html'
})
export class EditTransactionModal implements OnInit {

  @ViewChild('numpad') numpad!: NumpadComponent;

  editMode = signal<EditMode>('EXPENSE');
  submitting = signal(false);
  showDebtConfirm = signal(false);
  loading = signal(true);
  currentAmount = signal(0);

  accounts = signal<Account[]>([]);
  categories = signal<Category[]>([]);
  goals = signal<Goal[]>([]);

  isBalanceTx = false;
  showExtras = false;
  isSavingsTx = false;
  savingsGoalName = '';

  selectedAccountId = '';
  toAccountId = '';
  selectedCategoryId = '';
  description = '';
  selectedDate = '';
  selectedGoalId = '';

  private txId = '';
  private transferGroupId = '';
  private originalType: 'INCOME' | 'EXPENSE' = 'INCOME';

  readonly today = new Date().toISOString().split('T')[0];
  readonly typeOptions = [
    { key: 'EXPENSE' as const, label: 'Gasto' },
    { key: 'INCOME' as const, label: 'Ingreso' },
  ];
  readonly formatCurrency = formatCurrency;

  filteredCategories = computed(() => {
    const m = this.editMode();
    if (m === 'TRANSFER' || m === 'BALANCE') return [];
    return this.categories().filter(c => c.type === m);
  });

  topCategories = computed(() => this.filteredCategories().slice(0, 9));

  selectedAccountBalance = computed(() => {
    const acc = this.accounts().find(a => a.id === this.selectedAccountId);
    return parseFloat(String(acc?.balance ?? '0'));
  });

  constructor(
    private financeService: FinanceService,
    private toast: ToastService,
    public editTxService: EditTransactionModalService
  ) { }

  ngOnInit(): void {
    let loaded = 0;
    const done = () => {
      if (++loaded >= 3) {
        this.loading.set(false);
        this.initFromTransaction();
      }
    };

    this.financeService.getAccounts().subscribe({
      next: accs => { this.accounts.set(accs); done(); },
      error: () => done()
    });

    this.financeService.getCategories().subscribe({
      next: cats => { this.categories.set(cats); done(); },
      error: () => done()
    });

    this.financeService.getGoals().subscribe({
      next: g => { this.goals.set(g.filter(goal => goal.status === 'ACTIVE')); done(); },
      error: () => done()
    });
  }

  onAmountChange(amount: number): void {
    this.currentAmount.set(amount);
  }

  private initFromTransaction(): void {
    const tx = this.editTxService.transaction();
    if (!tx) return;

    if (tx.type === 'TRANSFER') {
      const td = tx as TransferDisplay;
      this.editMode.set('TRANSFER');
      this.numpad.setFromNumber(td.amount);
      this.selectedAccountId = td.fromAccountId;
      this.toAccountId = td.toAccountId;
      this.description = td.description ?? '';
      this.selectedDate = td.date.substring(0, 10);
      this.transferGroupId = td.groupId;
    } else {
      const t = tx as Transaction;
      const isAdjustmentTx = !t.isInitialBalance && (
        t.description?.startsWith('Ajuste de balance') ||
        t.description?.startsWith('Balance inicial')
      );
      if (t.isInitialBalance || isAdjustmentTx) {
        this.toast.warning('No puedes editar un ajuste de balance');
        this.editTxService.close();
        return;
      }

      // Check if it's a savings transaction
      this.isSavingsTx = isSavingsTx(t);
      if (this.isSavingsTx && t.description) {
        this.savingsGoalName = t.description.replace('Ahorro para meta: ', '');
        const goal = this.goals().find(g => g.name === this.savingsGoalName);
        if (goal) {
          this.selectedGoalId = goal.id;
        }
      }

      this.txId = t.id;
      this.isBalanceTx = !!t.isInitialBalance;
      this.originalType = t.type as 'INCOME' | 'EXPENSE';
      this.numpad.setFromNumber(parseFloat(String(t.amount)));
      this.selectedAccountId = t.accountId;
      this.selectedCategoryId = t.categoryId ?? '';
      this.description = t.description ?? '';
      this.selectedDate = t.date.substring(0, 10);
      this.editMode.set(this.isBalanceTx ? 'BALANCE' : (t.type as 'INCOME' | 'EXPENSE'));
    }
  }

  setType(mode: 'INCOME' | 'EXPENSE'): void {
    if (this.isBalanceTx || this.editMode() === 'TRANSFER' || this.isSavingsTx) return;
    this.editMode.set(mode);
    this.selectedCategoryId = '';
  }

  submit(): void {
    if (this.currentAmount() <= 0) { this.toast.warning('Ingresa un monto mayor a 0'); return; }
    if (!this.selectedAccountId) { this.toast.warning('Selecciona una cuenta'); return; }
    if (this.editMode() === 'TRANSFER') { this.submitTransfer(); return; }
    if (this.isBalanceTx) {
      this.showBalanceModeModal.set(true);
      return;
    }
    if (this.isSavingsTx) {
      if (!this.selectedGoalId) { this.toast.warning('Selecciona una meta'); return; }
    } else if (!this.selectedCategoryId) {
      this.toast.warning('Selecciona una categoria'); return;
    }
    if (this.editMode() === 'EXPENSE' && this.currentAmount() > this.selectedAccountBalance()) {
      this.showDebtConfirm.set(true); return;
    }
    this.executeUpdate(false);
  }

  private submitTransaction(): void {
    const mode = this.editMode();
    if (mode !== 'BALANCE' && !this.selectedCategoryId) {
      this.toast.warning('Selecciona una categoria'); return;
    }
    if (mode === 'EXPENSE' && this.currentAmount() > this.selectedAccountBalance()) {
      this.showDebtConfirm.set(true); return;
    }
    this.executeUpdate(false);
  }

  confirmDebt(): void { this.showDebtConfirm.set(false); this.executeUpdate(true); }
  cancelDebt(): void { this.showDebtConfirm.set(false); }

  showBalanceModeModal = signal(false);
  private pendingBalanceMode: 'adjustment' | 'income' | null = null;

  confirmBalanceMode(mode: 'adjustment' | 'income'): void {
    this.showBalanceModeModal.set(false);
    this.pendingBalanceMode = mode;
    this.executeUpdate(false);
  }

  cancelBalanceMode(): void {
    this.showBalanceModeModal.set(false);
    this.pendingBalanceMode = null;
  }

  private executeUpdate(allowNegative: boolean): void {
    this.submitting.set(true);
    const type = this.editMode() === 'BALANCE'
      ? this.originalType
      : (this.editMode() as 'INCOME' | 'EXPENSE');

    let description = this.description.trim() || undefined;
    let categoryId = this.selectedCategoryId || undefined;

    if (this.isSavingsTx) {
      const goal = this.goals().find(g => g.id === this.selectedGoalId);
      if (goal) {
        description = `Ahorro para meta: ${goal.name}`;
        // Keep the original savings category
        const savingsCategory = this.categories().find(c => c.name === 'Ahorros' && c.type === 'EXPENSE');
        if (savingsCategory) categoryId = savingsCategory.id;
      }
    }

    const payload: any = {
      accountId: this.selectedAccountId,
      categoryId,
      amount: this.currentAmount(),
      type,
      description,
      date: this.selectedDate,
      allowNegative
    };

    if (this.isBalanceTx && this.pendingBalanceMode === 'adjustment') {
      payload.isInitialBalance = true;
    } else if (this.isBalanceTx && this.pendingBalanceMode === 'income') {
      payload.isInitialBalance = false;
    }

    this.financeService.updateTransaction(this.txId, payload).subscribe({
      next: () => {
        this.toast.success('Transaccion actualizada');
        this.submitting.set(false);
        this.pendingBalanceMode = null;
        this.editTxService.notifySaved();
      },
      error: err => {
        const msg = err?.error?.message ?? 'Error al actualizar';
        this.toast.error(Array.isArray(msg) ? msg[0] : msg);
        this.submitting.set(false);
        this.pendingBalanceMode = null;
      }
    });
  }

  private submitTransfer(): void {
    if (!this.toAccountId) { this.toast.warning('Selecciona la cuenta destino'); return; }
    if (this.selectedAccountId === this.toAccountId) {
      this.toast.warning('Las cuentas deben ser diferentes'); return;
    }
    this.submitting.set(true);
    this.financeService.updateTransfer(this.transferGroupId, {
      fromAccountId: this.selectedAccountId,
      toAccountId: this.toAccountId,
      amount: this.currentAmount(),
      description: this.description.trim() || undefined,
      date: this.selectedDate,
    }).subscribe({
      next: () => {
        this.toast.success('Transferencia actualizada');
        this.submitting.set(false);
        this.editTxService.notifySaved();
      },
      error: err => {
        const msg = err?.error?.message ?? 'Error al actualizar';
        this.toast.error(Array.isArray(msg) ? msg[0] : msg);
        this.submitting.set(false);
      }
    });
  }

  close(): void { this.editTxService.close(); }
}