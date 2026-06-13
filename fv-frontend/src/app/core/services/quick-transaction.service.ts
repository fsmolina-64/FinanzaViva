import { Injectable, signal } from '@angular/core';
import { Transaction, TransactionAlert } from '../models/finance.model';

export interface QuickTransactionResult {
    transaction: Transaction;
    alert: TransactionAlert | null;
}

@Injectable({ providedIn: 'root' })
export class QuickTransactionService {
    readonly show = signal(false);
    readonly modalType = signal<'INCOME' | 'EXPENSE' | 'TRANSFER'>('EXPENSE');
    readonly lastCreated = signal<QuickTransactionResult | null>(null);

    open(type: 'INCOME' | 'EXPENSE' | 'TRANSFER' = 'EXPENSE'): void {
        this.modalType.set(type);
        this.show.set(true);
    }

    close(): void { this.show.set(false); }

    notifyCreated(res: QuickTransactionResult): void {
        this.lastCreated.set(res);
    }

    resetLastCreated(): void { this.lastCreated.set(null); }
}