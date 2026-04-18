import { Component, inject, signal, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GameService, Job, Stock } from '../services/game.service';
import { Nav } from '../shared/nav/nav';

type SimTab = 'mercado' | 'empleos' | 'emergencias';

interface Emergency {
  id: string;
  title: string;
  emoji: string;
  cost: number;
  description: string;
  canInsure: boolean;
}

@Component({
  selector: 'app-simulador',
  imports: [RouterLink, CommonModule, Nav],
  templateUrl: './simulador.html',
  styleUrl: './simulador.css',
})
export class Simulador implements OnDestroy {
  game = inject(GameService);

  activeTab = signal<SimTab>('mercado');
  buyQty = signal<Record<string, number>>({});
  sellQty = signal<Record<string, number>>({});
  toastMsg = signal<string | null>(null);
  toastPositive = signal(true);
  activeEmergency = signal<Emergency | null>(null);
  marketInterval: ReturnType<typeof setInterval>;

  readonly emergencies: Emergency[] = [
    { id: 'medical', title: 'Emergencia Médica', emoji: '🏥', cost: 800, description: 'Una visita de urgencias inesperada. Los seguros te pueden proteger.', canInsure: true },
    { id: 'car', title: 'Carro Averiado', emoji: '🚗', cost: 450, description: 'El motor falló. Necesitas repararlo para ir a trabajar.', canInsure: true },
    { id: 'phone', title: 'Celular Roto', emoji: '📱', cost: 300, description: 'Se cayó y la pantalla quedó destrozada.', canInsure: false },
    { id: 'layoff', title: 'Reducción de Nómina', emoji: '📉', cost: 1200, description: 'Tu empresa recorta personal. Un mes sin ingreso completo.', canInsure: false },
    { id: 'appliance', title: 'Nevera Dañada', emoji: '🧊', cost: 500, description: 'Se quemó el compresor. Hay que reemplazarla.', canInsure: true },
  ];

  constructor() {
    this.marketInterval = setInterval(() => {
      this.game.simulateMarket();
    }, 4000);
  }

  ngOnDestroy() {
    clearInterval(this.marketInterval);
  }

  getBuyQty(symbol: string): number {
    return this.buyQty()[symbol] ?? 1;
  }

  getSellQty(symbol: string): number {
    return this.sellQty()[symbol] ?? 1;
  }

  setBuyQty(symbol: string, qty: number) {
    this.buyQty.update(q => ({ ...q, [symbol]: Math.max(1, qty) }));
  }

  setSellQty(symbol: string, qty: number) {
    this.sellQty.update(q => ({ ...q, [symbol]: Math.max(1, qty) }));
  }

  buy(symbol: string) {
    const qty = this.getBuyQty(symbol);
    const stock = this.game.stocks().find((s: Stock) => s.symbol === symbol);
    if (!stock) return;
    const cost = Math.round(stock.price * qty);
    if (this.game.buyStock(symbol, qty)) {
      this.showToast(`✅ Compraste ${qty}x ${symbol} por $${cost}`, true);
    } else {
      this.showToast(`❌ Sin fondos suficientes. Necesitas $${cost}`, false);
    }
  }

  sell(symbol: string) {
    const qty = this.getSellQty(symbol);
    const stock = this.game.stocks().find((s: Stock) => s.symbol === symbol);
    if (!stock) return;
    if (this.game.sellStock(symbol, qty)) {
      this.showToast(`💹 Vendiste ${qty}x ${symbol} por $${Math.round(stock.price * qty)}`, true);
    } else {
      this.showToast(`❌ No tienes suficientes acciones de ${symbol}`, false);
    }
  }

  applyJob(jobId: string) {
    const applied = this.game.setJob(jobId);
    if (applied) {
      const job = this.game.jobs().find((j: Job) => j.id === jobId);
      this.showToast(`🎉 ¡Conseguiste el trabajo de ${job?.title}! Salario: $${job?.salary}/mes`, true);
    } else {
      this.showToast(`🔒 Necesitas más nivel para este empleo`, false);
    }
  }

  collectSalary() {
    const salary = this.game.collectSalary();
    if (salary > 0) {
      this.showToast(`💼 Salario cobrado: $${salary}`, true);
    } else {
      this.showToast(`⚠️ No tienes empleo activo`, false);
    }
  }

  triggerRandomEmergency() {
    const idx = Math.floor(Math.random() * this.emergencies.length);
    this.activeEmergency.set(this.emergencies[idx]);
  }

  payEmergency() {
    const em = this.activeEmergency();
    if (!em) return;
    if (this.game.removeCoins(em.cost)) {
      this.showToast(`😰 Pagaste $${em.cost} por ${em.title}`, false);
    } else {
      const available = this.game.coins();
      if (available > 0) this.game.removeCoins(available);
      const diff = em.cost - available;
      this.game.addDebt(diff);
      this.showToast(`⚠️ Dinero insuficiente. Deuda aumentada en $${diff}`, false);
    }
    this.activeEmergency.set(null);
  }

  ignoreEmergency() {
    const em = this.activeEmergency();
    if (!em) return;
    const penalty = Math.round(em.cost * 0.3);
    this.game.addDebt(penalty);
    this.showToast(`😬 Ignorar tiene consecuencias: +$${penalty} en deudas`, false);
    this.activeEmergency.set(null);
  }

  showToast(msg: string, positive: boolean) {
    this.toastMsg.set(msg);
    this.toastPositive.set(positive);
    setTimeout(() => this.toastMsg.set(null), 3500);
  }

  getPriceBarWidth(price: number, max: number): number {
    return Math.min(100, (price / max) * 100);
  }

  get maxStockPrice(): number {
    return Math.max(...this.game.stocks().map((s: Stock) => s.price));
  }
}
