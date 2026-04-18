import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanzasService, MovType } from '../services/finanzas.service';
import { ProfileService } from '../services/profile.service';
import { Nav } from '../shared/nav/nav';

@Component({
  selector: 'app-finanzas',
  imports: [CommonModule, FormsModule, Nav],
  templateUrl: './finanzas.html',
  styleUrl: './finanzas.css',
})
export class Finanzas {
  svc     = inject(FinanzasService);
  profile = inject(ProfileService);

  showForm = signal(false);
  filterTipo = signal<'all' | MovType>('all');
  selectedMonth = signal(new Date().toISOString().slice(0, 7));
  toastMsg = signal<string | null>(null);
  toastPos = signal(true);
  deleteConfirm = signal<string | null>(null);

  // Form state
  formTipo = signal<MovType>('ingreso');
  formMonto = signal('');
  formConcepto = signal('');
  formFecha = signal(new Date().toISOString().split('T')[0]);
  formCategoria = signal('');
  formError = signal<string | null>(null);

  get categorias() {
    return this.formTipo() === 'ingreso' ? this.svc.categoriasIngreso : this.svc.categoriasEgreso;
  }

  filteredMovs = computed(() => {
    let movs = this.svc.getMovsByMonth(this.selectedMonth());
    if (this.filterTipo() !== 'all') movs = movs.filter(m => m.tipo === this.filterTipo());
    return movs;
  });

  monthIngresos = computed(() =>
    this.svc.getMovsByMonth(this.selectedMonth()).filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0)
  );
  monthEgresos = computed(() =>
    this.svc.getMovsByMonth(this.selectedMonth()).filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)
  );
  monthBalance = computed(() => this.monthIngresos() - this.monthEgresos());

  openForm(tipo: MovType = 'ingreso') {
    this.formTipo.set(tipo);
    this.formMonto.set('');
    this.formConcepto.set('');
    this.formFecha.set(new Date().toISOString().split('T')[0]);
    this.formCategoria.set('');
    this.formError.set(null);
    this.showForm.set(true);
  }

  submitForm() {
    this.formError.set(null);
    const monto = parseFloat(this.formMonto());
    if (!monto || monto <= 0) { this.formError.set('El monto debe ser mayor a 0.'); return; }
    if (!this.formConcepto().trim()) { this.formError.set('El concepto es obligatorio.'); return; }
    if (!this.formFecha()) { this.formError.set('Selecciona una fecha.'); return; }
    if (!this.formCategoria()) { this.formError.set('Selecciona una categoría.'); return; }

    this.svc.agregar(this.formTipo(), monto, this.formConcepto().trim(), this.formFecha(), this.formCategoria());
    this.profile.unlockAchievement('first_mov');
    this.profile.addXP(10); // small XP bonus for recording finances
    this.showForm.set(false);
    const tipo = this.formTipo() === 'ingreso' ? 'Ingreso' : 'Egreso';
    this.toast(`✅ ${tipo} registrado correctamente`, true);
  }

  eliminar(id: string) {
    this.svc.eliminar(id);
    this.deleteConfirm.set(null);
    this.toast('🗑️ Movimiento eliminado', false);
  }

  toast(msg: string, pos: boolean) {
    this.toastMsg.set(msg);
    this.toastPos.set(pos);
    setTimeout(() => this.toastMsg.set(null), 3000);
  }

  formatDate(d: string): string {
    return new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d + 'T12:00'));
  }

  monthLabel(m: string): string {
    const [y, mo] = m.split('-');
    return new Intl.DateTimeFormat('es-EC', { month: 'long', year: 'numeric' }).format(new Date(+y, +mo - 1));
  }

  prevMonth() { this.shiftMonth(-1); }
  nextMonth() { this.shiftMonth(1); }
  private shiftMonth(dir: number) {
    const [y, m] = this.selectedMonth().split('-').map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    this.selectedMonth.set(d.toISOString().slice(0, 7));
  }

  categoryIcon(cat: string): string {
    const map: Record<string, string> = {
      Salario:'💼', Freelance:'💻', Inversión:'📈', Bonificación:'🎁',
      Regalo:'🎀', Venta:'🏷️', Alimentación:'🍽️', Transporte:'🚌',
      Vivienda:'🏠', Salud:'🏥', Educación:'📚', Entretenimiento:'🎮',
      Ropa:'👗', Deudas:'⛓️', Servicios:'💡', Otro:'📌',
    };
    return map[cat] ?? '📌';
  }
}
