import { Component, Input, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../../core/services/finance.service';
import { ToastService } from '../../../core/services/toast.service';
import {
    Account, Category, Transaction, TransactionAlert, CreateTransactionPayload
} from '../../../core/models/finance.model';

type ModalType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

@Component({
    selector: 'app-quick-transaction-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './quick-transaction-modal.html'
})
export class QuickTransactionModal implements OnInit {
    @Input() initialType: ModalType = 'EXPENSE';
    @Output() closed = new EventEmitter<void>();
    @Output() transactionCreated = new EventEmitter<{ transaction: Transaction; alert: TransactionAlert | null }>();

    accounts = signal<Account[]>([]);
    categories = signal<Category[]>([]);
    loading = signal(true);
    submitting = signal(false);

    selectedType = signal<ModalType>('EXPENSE');

    amountStr = '0';
    selectedCategoryId = '';
    selectedAccountId = '';
    description = '';
    selectedDate = new Date().toISOString().split('T')[0];
    showExtras = false;

    readonly today = new Date().toISOString().split('T')[0];

    readonly typeOptions: { key: ModalType; label: string }[] = [
        { key: 'EXPENSE', label: 'Gasto' },
        { key: 'INCOME', label: 'Ingreso' },
        { key: 'TRANSFER', label: 'Transferencia' }
    ];

    readonly numpadKeys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '<'];

    filteredCategories = computed(() => {
        const t = this.selectedType();
        const cats = this.categories();
        return cats.filter(c => c.type === (t === 'INCOME' ? 'INCOME' : 'EXPENSE'));
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
            next: cats => {
                this.categories.set(cats);
                this.preselectCategory();
                done();
            },
            error: done
        });
    }

    private preselectCategory(): void {
        const first = this.filteredCategories()[0];
        this.selectedCategoryId = first?.id ?? '';
    }

    setType(type: ModalType): void {
        this.selectedType.set(type);
        this.selectedCategoryId = '';
        const first = this.filteredCategories()[0];
        this.selectedCategoryId = first?.id ?? '';
    }

    pad(key: string): void {
        if (key === '<') {
            this.amountStr = this.amountStr.length <= 1 ? '0' : this.amountStr.slice(0, -1);
            return;
        }
        if (key === '.' && this.amountStr.includes('.')) return;
        const parts = this.amountStr.split('.');
        if (parts[1] !== undefined && parts[1].length >= 2) return;
        this.amountStr = this.amountStr === '0' && key !== '.'
            ? key
            : this.amountStr + key;
    }

    getAmount(): number { return parseFloat(this.amountStr) || 0; }

    formatAmount(): string {
        return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' })
            .format(this.getAmount());
    }

    submit(): void {
        if (this.getAmount() <= 0) { this.toast.warning('Ingresa un monto mayor a 0'); return; }
        if (!this.selectedAccountId) { this.toast.warning('Selecciona una cuenta'); return; }
        if (!this.selectedCategoryId) { this.toast.warning('Selecciona una categoria'); return; }

        this.submitting.set(true);
        const payload: CreateTransactionPayload = {
            accountId: this.selectedAccountId,
            categoryId: this.selectedCategoryId,
            amount: this.getAmount(),
            type: this.selectedType(),
            description: this.description.trim() || undefined,
            date: this.selectedDate
        };

        this.financeService.createTransaction(payload).subscribe({
            next: res => {
                this.toast.success('Transaccion registrada');
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

    private reset(): void {
        this.amountStr = '0';
        this.description = '';
        this.selectedDate = this.today;
        this.showExtras = false;
        this.preselectCategory();
    }

    close(): void { this.closed.emit(); }
}