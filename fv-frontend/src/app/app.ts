import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { routeAnimation, fabMenuAnimation } from './core/animations/animations';
import { QuickTransactionModal } from './shared/components/quick-transaction-modal/quick-transaction-modal';
import { EditTransactionModal } from './features/finances/edit-transaction-modal/edit-transaction-modal';
import { ToastComponent } from './shared/components/toast/toast';
import { QuickTransactionService, QuickTransactionResult } from './core/services/quick-transaction.service';
import { EditTransactionModalService } from './core/services/edit-transaction-modal.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, QuickTransactionModal, EditTransactionModal, ToastComponent],
  animations: [routeAnimation, fabMenuAnimation],
  template: `
    <div [@routeAnimation]="currentRoute()">
      <router-outlet />
    </div>
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

      @if (editTx.show()) {
      <app-edit-transaction-modal />
      }

      @if (fabMenuOpen()) {
      <div class="fixed inset-0 z-30" (click)="fabMenuOpen.set(false)"></div>
      }

      <div class="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2.5">
        @if (fabMenuOpen()) {
        <div class="flex flex-col items-end gap-2" @animateFab>
          <button (click)="openModal('TRANSFER')"
            class="bg-blue-600 hover:bg-blue-500 text-primary text-sm font-semibold pl-4 pr-5 py-2.5 rounded-full shadow-lg shadow-blue-600/30 transition-all hover:-translate-x-1 whitespace-nowrap">
            Transferencia
          </button>
          <button (click)="openModal('INCOME')"
            class="bg-success hover:bg-success/80 text-primary text-sm font-semibold pl-4 pr-5 py-2.5 rounded-full shadow-lg shadow-success/30 transition-all hover:-translate-x-1 whitespace-nowrap">
            Ingreso
          </button>
          <button (click)="openModal('EXPENSE')"
            class="bg-danger hover:bg-danger/80 text-primary text-sm font-semibold pl-4 pr-5 py-2.5 rounded-full shadow-lg shadow-danger/30 transition-all hover:-translate-x-1 whitespace-nowrap">
            Gasto
          </button>
        </div>
        }
        <button (click)="fabMenuOpen.set(!fabMenuOpen())"
          class="w-14 h-14 bg-blue-600 hover:bg-blue-500 rounded-full shadow-xl shadow-blue-600/40 text-primary text-3xl font-light flex items-center justify-center transition-all duration-300 active:scale-95"
          [style.transform]="fabMenuOpen() ? 'rotate(45deg)' : 'rotate(0)'">
          +
        </button>
      </div>

    }
  `
})
export class App {
  readonly quickTx    = inject(QuickTransactionService);
  readonly editTx     = inject(EditTransactionModalService);
  private readonly router = inject(Router);

  isAuthRoute = signal(true);
  fabMenuOpen = signal(false);
  currentRoute = signal('');

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      const url: string = e.urlAfterRedirects;
      this.currentRoute.set(url);
      this.isAuthRoute.set(url === '/' || url.startsWith('/auth/') || url.startsWith('/onboarding'));
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