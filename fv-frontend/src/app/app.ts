import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { QuickTransactionModal } from './shared/components/quick-transaction-modal/quick-transaction-modal';
import { ToastComponent } from './shared/components/toast/toast';
import { QuickTransactionService, QuickTransactionResult } from './core/services/quick-transaction.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, QuickTransactionModal, ToastComponent],
  template: `
    <router-outlet />
    <app-toast />

    @if (!isAuthRoute()) {

      @if (quickTx.show()) {
      <app-quick-transaction-modal
        [initialType]="quickTx.modalType()"
        (closed)="quickTx.close()"
        (transactionCreated)="onCreated($event)"
        (transferCreated)="onTransferCreated()">
      </app-quick-transaction-modal>
      }

      @if (fabMenuOpen()) {
      <div class="fixed inset-0 z-30" (click)="fabMenuOpen.set(false)"></div>
      }

      <div class="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2.5">
        @if (fabMenuOpen()) {
        <div class="flex flex-col items-end gap-2" style="animation: fadeIn 0.2s ease both">
          <button (click)="openModal('TRANSFER')"
            class="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold pl-4 pr-5 py-2.5 rounded-full shadow-lg shadow-blue-500/30 transition-all hover:-translate-x-1 whitespace-nowrap">
            Transferencia
          </button>
          <button (click)="openModal('INCOME')"
            class="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold pl-4 pr-5 py-2.5 rounded-full shadow-lg shadow-emerald-500/30 transition-all hover:-translate-x-1 whitespace-nowrap">
            Ingreso
          </button>
          <button (click)="openModal('EXPENSE')"
            class="bg-red-600 hover:bg-red-500 text-white text-sm font-semibold pl-4 pr-5 py-2.5 rounded-full shadow-lg shadow-red-500/30 transition-all hover:-translate-x-1 whitespace-nowrap">
            Gasto
          </button>
        </div>
        }
        <button (click)="fabMenuOpen.set(!fabMenuOpen())"
          class="w-14 h-14 bg-blue-600 hover:bg-blue-500 rounded-full shadow-xl shadow-blue-500/40 text-white text-3xl font-light flex items-center justify-center transition-all duration-300 active:scale-95"
          [style.transform]="fabMenuOpen() ? 'rotate(45deg)' : 'rotate(0)'">
          +
        </button>
      </div>

    }
  `
})
export class App {
  readonly quickTx = inject(QuickTransactionService);
  private readonly router = inject(Router);

  isAuthRoute = signal(true);
  fabMenuOpen = signal(false);

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      const url: string = e.urlAfterRedirects;
      this.isAuthRoute.set(url === '/' || url.startsWith('/auth/'));
      this.fabMenuOpen.set(false);
    });
  }

  openModal(type: 'INCOME' | 'EXPENSE' | 'TRANSFER'): void {
    this.fabMenuOpen.set(false);
    this.quickTx.open(type);
  }

  onCreated(res: QuickTransactionResult): void {
    this.quickTx.notifyCreated(res);
    this.quickTx.close();
    setTimeout(() => this.quickTx.resetLastCreated(), 200);
  }

  onTransferCreated(): void {
    this.quickTx.notifyReload();
    this.quickTx.close();
    setTimeout(() => this.quickTx.resetReload(), 200);
  }
}