import { Component, Input, Output, EventEmitter, OnInit, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../../core/services/finance.service';
import { ToastService } from '../../../core/services/toast.service';
import { fadeIn } from '../../../core/animations/animations';
import {
    Account, Category, Transaction, TransactionAlert,
    CreateTransactionPayload, CreateTransferPayload, TransferResponse
} from '../../../core/models/finance.model';
import { NumpadComponent } from '../numpad/numpad.component';
import { formatCurrency } from '../../utils/amount.utils';

type ModalType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

@Component({
    selector: 'app-quick-transaction-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, NumpadComponent],
    templateUrl: './quick-transaction-modal.html',
    animations: [fadeIn]
})
export class QuickTransactionModal implements OnInit {
    @ViewChild('numpad') numpad!: NumpadComponent;
    @Input() initialType: ModalType = 'EXPENSE';
    @Output() closed = new EventEmitter<void>();
    @Output() transactionCreated = new EventEmitter<{ transaction: Transaction; alert: TransactionAlert | null }>();
    @Output() transferCreated = new EventEmitter<TransferResponse>();

    accounts = signal<Account[]>([]);
    categories = signal<Category[]>([]);
    loading = signal(true);
    submitting = signal(false);
    currentAmount = signal(0);

    showDebtConfirm = signal(false);
    private pendingPayload: CreateTransactionPayload | null = null;

    selectedType = signal<ModalType>('EXPENSE');

    selectedCategoryId = '';
    selectedAccountId = '';
    toAccountId = '';
    description = '';
    selectedDate = new Date().toISOString().split('T')[0];
    showExtras = false;

    readonly today = new Date().toISOString().split('T')[0];
    readonly typeOptions: { key: ModalType; label: string }[] = [
        { key: 'EXPENSE', label: 'Gasto' },
        { key: 'INCOME', label: 'Ingreso' },
        { key: 'TRANSFER', label: 'Transferencia' }
    ];
    readonly formatCurrency = formatCurrency;

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

    getSelectedAccountBalance(): number {
        const acc = this.accounts().find(a => a.id === this.selectedAccountId);
        return parseFloat(String(acc?.balance ?? '0'));
    }

    onAmountChange(amount: number): void {
        this.currentAmount.set(amount);
    }

    submit(): void {
        if (this.currentAmount() <= 0) { this.toast.warning('Ingresa un monto mayor a 0'); return; }
        if (!this.selectedAccountId) { this.toast.warning('Selecciona una cuenta'); return; }
        this.selectedType() === 'TRANSFER' ? this.submitTransfer() : this.submitTransaction();
    }

    private submitTransaction(): void {
        if (!this.selectedCategoryId) { this.toast.warning('Selecciona una categoria'); return; }

        const payload: CreateTransactionPayload = {
            accountId: this.selectedAccountId,
            categoryId: this.selectedCategoryId,
            amount: this.currentAmount(),
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
        if (this.currentAmount() > this.getSelectedAccountBalance()) { this.toast.error('Saldo insuficiente en la cuenta origen'); return; }

        const payload: CreateTransferPayload = {
            fromAccountId: this.selectedAccountId,
            toAccountId: this.toAccountId,
            amount: this.currentAmount(),
            description: this.description.trim() || undefined,
            date: this.selectedDate
        };

        this.submitting.set(true);
        this.financeService.createTransfer(payload).subscribe({
            next: res => {
                this.toast.success('Transferencia completada');
                this.transferCreated.emit(res);
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
        this.numpad.setFromNumber(0);
        this.currentAmount.set(0);
        this.description = '';
        this.toAccountId = '';
        this.selectedDate = this.today;
        this.showExtras = false;
        this.showDebtConfirm.set(false);
        this.pendingPayload = null;
        this.preselectCategory();
    }

    close(): void { this.closed.emit(); }
}