import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GameService } from '../services/game.service';
import { Nav } from '../shared/nav/nav';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, CommonModule, Nav],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  game = inject(GameService);

  activeTab = signal<'overview' | 'transactions' | 'achievements' | 'cards'>('overview');
  toastMsg = signal<string | null>(null);

  readonly spendingCategories = [
    { label: 'Inversiones', percent: 35, color: '#6366f1', icon: '📈' },
    { label: 'Estilo de vida', percent: 25, color: '#f5a623', icon: '🎉' },
    { label: 'Necesidades', percent: 30, color: '#00d4aa', icon: '🏠' },
    { label: 'Emergencias', percent: 10, color: '#f43f5e', icon: '🆘' },
  ];

  ngOnInit() {
    // Simulate market every 5 seconds
    setInterval(() => {
      this.game.simulateMarket();
    }, 5000);
  }

  usePower(cardId: string) {
    const used = this.game.usePowerCard(cardId);
    if (used) {
      this.showToast('¡Carta de poder activada! Úsala en el tablero 🃏');
    } else {
      this.showToast('Esta carta no tiene usos disponibles 😕');
    }
  }

  showToast(msg: string) {
    this.toastMsg.set(msg);
    setTimeout(() => this.toastMsg.set(null), 3000);
  }

  getTransactionColor(type: string): string {
    return type === 'income' ? '#00d4aa' : type === 'expense' ? '#f43f5e' : '#6366f1';
  }

  getTransactionSign(amount: number): string {
    return amount >= 0 ? '+' : '';
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(date));
  }

  get netWorthFormatted() {
    return this.game.formatCurrency(this.game.netWorth());
  }
}
