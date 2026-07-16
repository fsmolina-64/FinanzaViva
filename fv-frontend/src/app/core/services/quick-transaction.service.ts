import { Injectable, signal } from '@angular/core';
import { Transaction, TransactionAlert, TransferResponse } from '../models/finance.model';

export interface QuickTransactionResult {
    transaction: Transaction;
    alert: TransactionAlert | null;
}

export interface QuickTransferResult {
    fromTransaction: Transaction;
    toTransaction: Transaction;
}

@Injectable({ providedIn: 'root' })
export class QuickTransactionService {
    readonly show = signal(false);
    readonly modalType = signal<'INCOME' | 'EXPENSE' | 'TRANSFER'>('EXPENSE');
    readonly lastCreated = signal<QuickTransactionResult | null>(null);
    readonly lastTransferCreated = signal<QuickTransferResult | null>(null);
    readonly reloadTick = signal(0);

    open(type: 'INCOME' | 'EXPENSE' | 'TRANSFER' = 'EXPENSE'): void {
        this.modalType.set(type);
        this.show.set(true);
    }

    close(): void { this.show.set(false); }

    notifyCreated(res: QuickTransactionResult): void { this.lastCreated.set(res); }
    notifyTransferCreated(res: QuickTransferResult): void { this.lastTransferCreated.set(res); }
    resetLastCreated(): void { this.lastCreated.set(null); }
    resetLastTransferCreated(): void { this.lastTransferCreated.set(null); }

    notifyReload(): void { this.reloadTick.update(n => n + 1); }
    resetReload(): void { /* no es necesario resetear, el tick es incremental */ }
}