import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { Transaction, TransferDisplay } from '../models/finance.model';

@Injectable({ providedIn: 'root' })
export class EditTransactionModalService {
  private readonly _show        = signal(false);
  private readonly _transaction = signal<Transaction | TransferDisplay | null>(null);

  readonly show        = this._show.asReadonly();
  readonly transaction = this._transaction.asReadonly();
  readonly saved$      = new Subject<void>();

  open(tx: Transaction | TransferDisplay): void {
    this._transaction.set(tx);
    this._show.set(true);
  }

  notifySaved(): void {
    this.saved$.next();
    this.close();
  }

  close(): void {
    this._show.set(false);
    this._transaction.set(null);
  }
}
