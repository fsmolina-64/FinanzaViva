import { Component, Input, Output, EventEmitter, OnInit, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../../core/services/finance.service';
import { ToastService } from '../../../core/services/toast.service';
import { fadeIn } from '../../../core/animations/animations';
import {
    Account, Category, Transaction, TransactionAlert,
    CreateTransactionPayload, CreateTransferPayload, TransferResponse
} from '../../../core/models/finance.model';

type ModalType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

@Component({
    selector: 'app-quick-transaction-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './quick-transaction-modal.html',
    animations: [fadeIn]
})
export class QuickTransactionModal implements OnInit {
    @Input() initialType: ModalType = 'EXPENSE';
    @Output() closed = new EventEmitter<void>();
    @Output() transactionCreated = new EventEmitter<{ transaction: Transaction; alert: TransactionAlert | null }>();
    @Output() transferCreated = new EventEmitter<void>();

    accounts = signal<Account[]>([]);
    categories = signal<Category[]>([]);
    loading = signal(true);
    submitting = signal(false);

    showDebtConfirm = signal(false);
    private pendingPayload: CreateTransactionPayload | null = null;

    selectedType = signal<ModalType>('EXPENSE');

    /**
     * integerStr: parte entera como string  ('0', '12', '1500')
     * decimalStr: null = modo entero | '' | '5' | '50' = modo decimal
     * Separación clara de estado → sin ambigüedad de "modo"
     */
    integerStr = '0';
    decimalStr: string | null = null;

    selectedCategoryId = '';
    selectedAccountId = '';
    toAccountId = '';
    description = '';
    selectedDate = new Date().toISOString().split('T')[0];
    showExtras = false;

    // ── Keyboard press visual feedback ───────────────────────────
    pressedKey = signal<string | null>(null);
    private pressedTimer: any = null;

    private visualPress(key: string): void {
        if (this.pressedTimer) clearTimeout(this.pressedTimer);
        this.pressedKey.set(key);
        this.pressedTimer = setTimeout(() => this.pressedKey.set(null), 200);
    }

    readonly today = new Date().toISOString().split('T')[0];
    readonly numpadKeys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '<'];
    readonly typeOptions: { key: ModalType; label: string }[] = [
        { key: 'EXPENSE', label: 'Gasto' },
        { key: 'INCOME', label: 'Ingreso' },
        { key: 'TRANSFER', label: 'Transferencia' }
    ];

    /** true cuando el usuario ya presionó el punto decimal */
    get inDecimalMode(): boolean { return this.decimalStr !== null; }

    filteredCategories = computed(() => {
        const t = this.selectedType();
        if (t === 'TRANSFER') return [];
        return this.categories().filter(c => c.type === (t === 'INCOME' ? 'INCOME' : 'EXPENSE'));
    });

    topCategories = computed(() => this.filteredCategories().slice(0, 9));



    constructor(
        private financeService: FinanceService,
        private toast: ToastService
    ) { }

    ngOnInit(): void {
        this.selectedType.set(this.initialType);
        let loaded = 0;
        const done = () => { if (++loaded >= 2) this.loading.set(false); };

        this.financeService.getAccounts().subscribe({
            next: accs => {
                this.accounts.set(accs);
                const def = accs.find(a => a.isDefault) ?? accs[0];
                if (def) this.selectedAccountId = def.id;
                done();
            },
            error: done
        });

        this.financeService.getCategories().subscribe({
            next: cats => { this.categories.set(cats); this.preselectCategory(); done(); },
            error: done
        });
    }

    private preselectCategory(): void {
        const first = this.filteredCategories()[0];
        this.selectedCategoryId = first?.id ?? '';
    }

    setType(type: ModalType): void {
        this.selectedType.set(type);
        this.toAccountId = '';
        this.showDebtConfirm.set(false);
        this.pendingPayload = null;
        setTimeout(() => this.preselectCategory(), 0);
    }

    pad(key: string): void {
        if (this.showDebtConfirm()) return;

        if (key === '<') {
            if (this.inDecimalMode) {
                if (this.decimalStr!.length === 0) {
                    this.decimalStr = null;
                } else {
                    this.decimalStr = this.decimalStr!.slice(0, -1);
                }
            } else {
                this.integerStr = this.integerStr.length <= 1 ? '0' : this.integerStr.slice(0, -1);
            }
            return;
        }

        if (key === '.') {
            if (!this.inDecimalMode) this.decimalStr = '';
            return;
        }

        if (!/^\d$/.test(key)) return;

        if (this.inDecimalMode) {
            if (this.decimalStr!.length >= 2) return;
            this.decimalStr = this.decimalStr + key;
        } else {
            if (this.integerStr === '0') {
                this.integerStr = key;
            } else {
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
            '0':'0','1':'1','2':'2','3':'3','4':'4','5':'5','6':'6','7':'7','8':'8','9':'9',
            'Numpad0':'0','Numpad1':'1','Numpad2':'2','Numpad3':'3','Numpad4':'4',
            'Numpad5':'5','Numpad6':'6','Numpad7':'7','Numpad8':'8','Numpad9':'9',
        };
        const mapped = map[e.key] ?? map[e.code];
        if (mapped) { e.preventDefault(); this.visualPress(mapped); this.pad(mapped); }
    }


    getAmount(): number {
        const integer = parseInt(this.integerStr) || 0;
        if (this.decimalStr === null || this.decimalStr === '') return integer;
        const decimal = parseInt(this.decimalStr.padEnd(2, '0')) / 100;
        return integer + decimal;
    }

    getIntegerDisplay(): string {
        return parseInt(this.integerStr).toLocaleString('en-US');
    }

    getDecimalDisplay(): string {
        if (this.decimalStr === null) return '__';
        const filled = this.decimalStr;
        const placeholder = '__'.slice(filled.length);
        return filled + placeholder;
    }

    formatAmount(): string {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(this.getAmount());
    }

    amountColorClass(): string {
        switch (this.selectedType()) {
            case 'EXPENSE': return 'text-red-400';
            case 'INCOME': return 'text-emerald-400';
            default: return 'text-blue-400';
        }
    }

    getSelectedAccountBalance(): number {
        const acc = this.accounts().find(a => a.id === this.selectedAccountId);
        return parseFloat(String(acc?.balance ?? '0'));
    }


    submit(): void {
        if (this.getAmount() <= 0) { this.toast.warning('Ingresa un monto mayor a 0'); return; }
        if (!this.selectedAccountId) { this.toast.warning('Selecciona una cuenta'); return; }
        this.selectedType() === 'TRANSFER' ? this.submitTransfer() : this.submitTransaction();
    }

    private submitTransaction(): void {
        if (!this.selectedCategoryId) { this.toast.warning('Selecciona una categoria'); return; }

        const payload: CreateTransactionPayload = {
            accountId: this.selectedAccountId,
            categoryId: this.selectedCategoryId,
            amount: this.getAmount(),
            type: this.selectedType() as 'INCOME' | 'EXPENSE',
            description: this.description.trim() || undefined,
            date: this.selectedDate
        };

        if (payload.type === 'EXPENSE' && payload.amount > this.getSelectedAccountBalance()) {
            this.pendingPayload = payload;
            this.showDebtConfirm.set(true);
            return;
        }
        this.executeTransaction(payload);
    }

    confirmDebt(): void {
        if (!this.pendingPayload) return;
        this.executeTransaction({ ...this.pendingPayload, allowNegative: true });
        this.showDebtConfirm.set(false);
        this.pendingPayload = null;
    }

    cancelDebt(): void {
        this.showDebtConfirm.set(false);
        this.pendingPayload = null;
    }

    private executeTransaction(payload: CreateTransactionPayload): void {
        this.submitting.set(true);
        this.financeService.createTransaction(payload).subscribe({
            next: res => {
                this.transactionCreated.emit(res);
                this.submitting.set(false);
                this.reset();
            },
            error: err => {
                const msg = err?.error?.message ?? 'Error al registrar';
                this.toast.error(Array.isArray(msg) ? msg[0] : msg);
                this.submitting.set(false);
            }
        });
    }

    private submitTransfer(): void {
        if (!this.toAccountId) { this.toast.warning('Selecciona la cuenta destino'); return; }
        if (this.selectedAccountId === this.toAccountId) { this.toast.warning('Las cuentas deben ser diferentes'); return; }
        if (this.getAmount() > this.getSelectedAccountBalance()) { this.toast.error('Saldo insuficiente en la cuenta origen'); return; }

        const payload: CreateTransferPayload = {
            fromAccountId: this.selectedAccountId,
            toAccountId: this.toAccountId,
            amount: this.getAmount(),
            description: this.description.trim() || undefined,
            date: this.selectedDate
        };

        this.submitting.set(true);
        this.financeService.createTransfer(payload).subscribe({
            next: () => {
                this.toast.success('Transferencia completada');
                this.transferCreated.emit();
                this.submitting.set(false);
                this.reset();
            },
            error: err => {
                const msg = err?.error?.message ?? 'Error en la transferencia';
                this.toast.error(Array.isArray(msg) ? msg[0] : msg);
                this.submitting.set(false);
            }
        });
    }

    private reset(): void {
        this.integerStr = '0';
        this.decimalStr = null;
        this.description = '';
        this.toAccountId = '';
        this.selectedDate = this.today;
        this.showExtras = false;
        this.showDebtConfirm.set(false);
        this.pendingPayload = null;
        this.preselectCategory();
    }

    amountCardClass(): string {
        switch (this.selectedType()) {
            case 'EXPENSE':  return 'border-red-500/15 from-red-500/5';
            case 'INCOME':   return 'border-emerald-500/15 from-emerald-500/5';
            default:         return 'border-blue-500/15 from-blue-500/5';
        }
    }

    close(): void { this.closed.emit(); }
}