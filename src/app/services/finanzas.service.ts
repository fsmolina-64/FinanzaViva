import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';

export type MovType = 'ingreso' | 'egreso';

export interface Movimiento {
  id: string;
  tipo: MovType;
  monto: number;
  concepto: string;
  fecha: string; // ISO date string yyyy-mm-dd
  categoria: string;
  createdAt: string;
}

const CATEGORIAS_INGRESO = ['Salario', 'Freelance', 'Inversión', 'Bonificación', 'Regalo', 'Venta', 'Otro'];
const CATEGORIAS_EGRESO  = ['Alimentación', 'Transporte', 'Vivienda', 'Salud', 'Educación', 'Entretenimiento', 'Ropa', 'Deudas', 'Servicios', 'Otro'];

@Injectable({ providedIn: 'root' })
export class FinanzasService {
  private auth = inject(AuthService);
  private readonly PREFIX = 'fv_movs_';

  movimientos = signal<Movimiento[]>([]);

  readonly categoriasIngreso = CATEGORIAS_INGRESO;
  readonly categoriasEgreso  = CATEGORIAS_EGRESO;

  // Computed totals
  totalIngresos = computed(() => this.movimientos().filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0));
  totalEgresos  = computed(() => this.movimientos().filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0));
  balance       = computed(() => this.totalIngresos() - this.totalEgresos());

  todayIngresos = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.movimientos().filter(m => m.tipo === 'ingreso' && m.fecha === today).reduce((s, m) => s + m.monto, 0);
  });
  todayEgresos = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.movimientos().filter(m => m.tipo === 'egreso' && m.fecha === today).reduce((s, m) => s + m.monto, 0);
  });

  thisMonthIngresos = computed(() => {
    const month = new Date().toISOString().slice(0, 7);
    return this.movimientos().filter(m => m.tipo === 'ingreso' && m.fecha.startsWith(month)).reduce((s, m) => s + m.monto, 0);
  });
  thisMonthEgresos = computed(() => {
    const month = new Date().toISOString().slice(0, 7);
    return this.movimientos().filter(m => m.tipo === 'egreso' && m.fecha.startsWith(month)).reduce((s, m) => s + m.monto, 0);
  });

  loadForCurrentUser() {
    const sess = this.auth.session();
    if (!sess) { this.movimientos.set([]); return; }
    try {
      const raw = localStorage.getItem(this.PREFIX + sess.email);
      this.movimientos.set(raw ? JSON.parse(raw) : []);
    } catch { this.movimientos.set([]); }
  }

  agregar(tipo: MovType, monto: number, concepto: string, fecha: string, categoria: string): Movimiento {
    const mov: Movimiento = {
      id: Date.now().toString(),
      tipo, monto, concepto, fecha, categoria,
      createdAt: new Date().toISOString(),
    };
    const updated = [mov, ...this.movimientos()];
    this.movimientos.set(updated);
    this.persist(updated);
    return mov;
  }

  eliminar(id: string) {
    const updated = this.movimientos().filter(m => m.id !== id);
    this.movimientos.set(updated);
    this.persist(updated);
  }

  private persist(movs: Movimiento[]) {
    const sess = this.auth.session();
    if (!sess) return;
    localStorage.setItem(this.PREFIX + sess.email, JSON.stringify(movs));
  }

  formatMoney(n: number) {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
  }

  getMovsByMonth(yearMonth: string) {
    return this.movimientos().filter(m => m.fecha.startsWith(yearMonth));
  }
}
