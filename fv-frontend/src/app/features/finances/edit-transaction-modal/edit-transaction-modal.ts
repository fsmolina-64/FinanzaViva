import {
  Component, OnInit, OnDestroy,
  signal, computed, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../../core/services/finance.service';
import { ToastService } from '../../../core/services/toast.service';
import { EditTransactionModalService } from '../../../core/services/edit-transaction-modal.service';
import { Account, Category, Transaction, TransferDisplay } from '../../../core/models/finance.model';

type EditMode = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'BALANCE';

@Component({
  selector: 'app-edit-transaction-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-transaction-modal.html'
})
export class EditTransactionModal implements OnInit, OnDestroy {

  editMode = signal<EditMode>('EXPENSE');
  submitting = signal(false);
  showDebtConfirm = signal(false);
  loading = signal(true);
  pressedKey = signal<string | null>(null);

  accounts = signal<Account[]>([]);
  categories = signal<Category[]>([]);

  isBalanceTx = false;
  showExtras = false;

  integerStr = '0';
  decimalStr: string | null = null;

  selectedAccountId = '';
  toAccountId = '';
  selectedCategoryId = '';
  description = '';
  selectedDate = '';

  private txId = '';
  private transferGroupId = '';
  private originalType: 'INCOME' | 'EXPENSE' = 'INCOME';
  private pressedTimer: ReturnType<typeof setTimeout> | null = null;

  readonly today = new Date().toISOString().split('T')[0];
  readonly numpadKeys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '<'];
  readonly typeOptions = [
    { key: 'EXPENSE' as const, label: 'Gasto' },
    { key: 'INCOME' as const, label: 'Ingreso' },
  ];

  get inDecimalMode(): boolean { return this.decimalStr !== null; }

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

  amountColorClass = computed<string>(() => {
    switch (this.editMode()) {
      case 'INCOME': return 'text-emerald-400';
      case 'EXPENSE': return 'text-red-400';
      case 'TRANSFER': return 'text-blue-400';
      default: return 'text-purple-400';
    }
  });

  amountCardClass = computed<string>(() => {
    switch (this.editMode()) {
      case 'EXPENSE': return 'border-red-500/15 from-red-500/5';
      case 'INCOME': return 'border-emerald-500/15 from-emerald-500/5';
      case 'TRANSFER': return 'border-blue-500/15 from-blue-500/5';
      default: return 'border-purple-500/15 from-purple-500/5';
    }
  });

  constructor(
    private financeService: FinanceService,
    private toast: ToastService,
    public editTxService: EditTransactionModalService
  ) { }

  ngOnInit(): void {
    let loaded = 0;
    const done = () => {
      if (++loaded >= 2) {
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
  }

  ngOnDestroy(): void {
    if (this.pressedTimer !== null) clearTimeout(this.pressedTimer);
  }

  private initFromTransaction(): void {
    const tx = this.editTxService.transaction();
    if (!tx) return;

    if (tx.type === 'TRANSFER') {
      const td = tx as TransferDisplay;
      this.editMode.set('TRANSFER');
      this.setAmountFromNumber(td.amount);
      this.selectedAccountId = td.fromAccountId;
      this.toAccountId = td.toAccountId;
      this.description = td.description ?? '';
      this.selectedDate = td.date.substring(0, 10);
      this.transferGroupId = td.groupId;
    } else {
      const t = tx as Transaction;
      this.txId = t.id;
      this.isBalanceTx = !!t.isInitialBalance;
      this.originalType = t.type as 'INCOME' | 'EXPENSE';
      this.setAmountFromNumber(parseFloat(String(t.amount)));
      this.selectedAccountId = t.accountId;
      this.selectedCategoryId = t.categoryId ?? '';
      this.description = t.description ?? '';
      this.selectedDate = t.date.substring(0, 10);
      this.editMode.set(this.isBalanceTx ? 'BALANCE' : (t.type as 'INCOME' | 'EXPENSE'));
    }
  }

  private setAmountFromNumber(amount: number): void {
    const whole = Math.floor(amount);
    const cents = Math.round((amount - whole) * 100);
    this.integerStr = String(whole);
    this.decimalStr = cents > 0 ? String(cents).padStart(2, '0') : null;
  }

  private visualPress(key: string): void {
    if (this.pressedTimer !== null) clearTimeout(this.pressedTimer);
    this.pressedKey.set(key);
    this.pressedTimer = setTimeout(() => this.pressedKey.set(null), 200);
  }

  setType(mode: 'INCOME' | 'EXPENSE'): void {
    if (this.isBalanceTx || this.editMode() === 'TRANSFER') return;
    this.editMode.set(mode);
    this.selectedCategoryId = '';
  }

  pad(key: string): void {
    if (this.showDebtConfirm()) return;

    if (key === '<') {
      if (this.inDecimalMode) {
        this.decimalStr = this.decimalStr!.length === 0 ? null : this.decimalStr!.slice(0, -1);
      } else {
        this.integerStr = this.integerStr.length <= 1 ? '0' : this.integerStr.slice(0, -1);
      }
      return;
    }
    if (key === '.') { if (!this.inDecimalMode) this.decimalStr = ''; return; }
    if (!/^\d$/.test(key)) return;

    if (this.inDecimalMode) {
      if (this.decimalStr!.length >= 2) return;
      this.decimalStr += key;
    } else {
      if (this.integerStr === '0') { this.integerStr = key; }
      else {
        const next = this.integerStr + key;
        if (parseInt(next) > 9_999_999) return;
        this.integerStr = next;
      }
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') { this.close(); return; }
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault(); this.visualPress('<'); this.pad('<'); return;
    }
    if (e.key === '.' || e.key === ',' || e.code === 'NumpadDecimal') {
      e.preventDefault(); this.visualPress('.'); this.pad('.'); return;
    }
    const map: Record<string, string> = {
      '0': '0', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
      'Numpad0': '0', 'Numpad1': '1', 'Numpad2': '2', 'Numpad3': '3', 'Numpad4': '4',
      'Numpad5': '5', 'Numpad6': '6', 'Numpad7': '7', 'Numpad8': '8', 'Numpad9': '9',
    };
    const mapped = map[e.key] ?? map[e.code];
    if (mapped) { e.preventDefault(); this.visualPress(mapped); this.pad(mapped); }
  }

  getAmount(): number {
    const integer = parseInt(this.integerStr) || 0;
    if (this.decimalStr === null || this.decimalStr === '') return integer;
    return integer + parseInt(this.decimalStr.padEnd(2, '0')) / 100;
  }

  getIntegerDisplay(): string { return parseInt(this.integerStr).toLocaleString('en-US'); }

  getDecimalDisplay(): string {
    if (this.decimalStr === null) return '__';
    return this.decimalStr + '__'.slice(this.decimalStr.length);
  }

  formatAmount(): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(this.getAmount());
  }

  submit(): void {
    if (this.getAmount() <= 0) { this.toast.warning('Ingresa un monto mayor a 0'); return; }
    if (!this.selectedAccountId) { this.toast.warning('Selecciona una cuenta'); return; }
    this.editMode() === 'TRANSFER' ? this.submitTransfer() : this.submitTransaction();
  }

  private submitTransaction(): void {
    const mode = this.editMode();
    if (mode !== 'BALANCE' && !this.selectedCategoryId) {
      this.toast.warning('Selecciona una categoria'); return;
    }
    if (mode === 'EXPENSE' && this.getAmount() > this.selectedAccountBalance()) {
      this.showDebtConfirm.set(true); return;
    }
    this.executeUpdate(false);
  }

  confirmDebt(): void { this.showDebtConfirm.set(false); this.executeUpdate(true); }
  cancelDebt(): void { this.showDebtConfirm.set(false); }

  private executeUpdate(allowNegative: boolean): void {
    this.submitting.set(true);
    const type = this.editMode() === 'BALANCE'
      ? this.originalType
      : (this.editMode() as 'INCOME' | 'EXPENSE');

    this.financeService.updateTransaction(this.txId, {
      accountId: this.selectedAccountId,
      categoryId: this.selectedCategoryId || undefined,
      amount: this.getAmount(),
      type,
      description: this.description.trim() || undefined,
      date: this.selectedDate,
      allowNegative
    }).subscribe({
      next: () => {
        this.toast.success('Transaccion actualizada');
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

  private submitTransfer(): void {
    if (!this.toAccountId) { this.toast.warning('Selecciona la cuenta destino'); return; }
    if (this.selectedAccountId === this.toAccountId) {
      this.toast.warning('Las cuentas deben ser diferentes'); return;
    }
    this.submitting.set(true);
    this.financeService.updateTransfer(this.transferGroupId, {
      fromAccountId: this.selectedAccountId,
      toAccountId: this.toAccountId,
      amount: this.getAmount(),
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